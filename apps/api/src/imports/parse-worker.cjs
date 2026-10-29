// Untrusted workbook parsing runs in a time/heap-bounded worker; never on the API thread.
const { parentPort, workerData } = require('node:worker_threads');
const { Readable } = require('node:stream');
const LIMIT = 8 * 1024 * 1024;
async function inspectZip(buffer) {
 const yauzl = require('yauzl');
 await new Promise((resolve,reject)=>{
  yauzl.fromBuffer(buffer,{lazyEntries:true,validateEntrySizes:true},(error,zip)=>{
   if(error)return reject(new Error('Malformed workbook'));
   let total=0,count=0,actual=0;const fail=()=>{zip.close();reject(new Error('Unsupported or oversized workbook'));};
   zip.on('error',fail);zip.on('end',resolve);
   zip.on('entry',entry=>{
    total+=entry.uncompressedSize;count++;
    if(count>500||total>32*1024*1024||(entry.generalPurposeBitFlag&1)||/vbaProject|externalLinks|embeddings|\.bin$/i.test(entry.fileName)||entry.fileName.includes('..'))return fail();
    if(entry.fileName.endsWith('/'))return zip.readEntry();
    zip.openReadStream(entry,(err,stream)=>{
     if(err)return fail();let rel='';
     stream.on('error',fail);stream.on('data',chunk=>{actual+=chunk.length;if(actual>32*1024*1024){stream.destroy();return fail();}if(entry.fileName.endsWith('.rels')){rel+=chunk.toString('utf8');if(rel.length>512*1024){stream.destroy();fail();}}});
     stream.on('end',()=>{if(/TargetMode\s*=\s*["']External/i.test(rel))return fail();zip.readEntry();});
    });
   });zip.readEntry();
  });
 });
}
async function parseFile(bytes,filename){
 const file=Buffer.from(bytes);if(!file.length||file.length>LIMIT)throw new Error('File must be between 1 byte and 8 MiB');
 const rows=[];let characters=0;
 const add=cells=>{if(cells.length>50)throw new Error('At most 50 columns are allowed');const row=Array.from(cells,x=>String(x??''));if(row.some(x=>x.length>1000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x)))throw new Error('Unsupported cell value');characters+=row.reduce((s,x)=>s+x.length,0);if(characters>LIMIT)throw new Error('Extracted text exceeds 8 MiB');if(rows.length>10000)throw new Error('At most 10,000 data rows are allowed');rows.push(row);};
 if(/\.csv$/i.test(filename)){
  const text=new TextDecoder('utf-8',{fatal:true}).decode(file);if(text.includes('\0'))throw new Error('Use UTF-8 CSV');
  const {parse}=require('csv-parse');const parser=Readable.from([text]).pipe(parse({bom:true,skip_empty_lines:true,max_record_size:64*1024,relax_column_count:false}));
  for await(const row of parser)add(row);
 }else if(/\.xlsx$/i.test(filename)){
  if(file.readUInt16LE(0)!==0x4b50)throw new Error('Not an XLSX workbook');await inspectZip(file);
  const ExcelJS=require('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.load(file);
  if(book.worksheets.length!==1)throw new Error('Upload a workbook with exactly one worksheet');
  const sheet=book.worksheets[0];if(sheet.rowCount>10001||sheet.columnCount>50)throw new Error('Workbook exceeds row or column limits');
  for(let i=1;i<=sheet.rowCount;i++){
   const row=sheet.getRow(i),cells=[];for(let c=1;c<=sheet.columnCount;c++){
    const cell=row.getCell(c),v=cell.value;
    if(v&&typeof v==='object'&&!(v instanceof Date))throw new Error('Formulas, links, rich text and error cells are not supported; paste values first');
    cells.push(v instanceof Date?v.toISOString().slice(0,10):v??'');
   }add(cells);
  }
 }else throw new Error('Only CSV and XLSX are supported');
 if(rows.length<2)throw new Error('A header and at least one data row are required');
 const headers=rows.shift().map((x,i)=>x.trim()||`Column ${i+1}`);
 if(headers.some(x=>x.length>120))throw new Error('Header names must be at most 120 characters');
 return {headers,rows};
}
module.exports={parseFile};
if(parentPort){parseFile(workerData.file,workerData.filename).then(value=>parentPort.postMessage({value})).catch(()=>parentPort.postMessage({error:'File could not be parsed. Use a UTF-8 CSV or a single-sheet, values-only XLSX within the published limits.'}));}
