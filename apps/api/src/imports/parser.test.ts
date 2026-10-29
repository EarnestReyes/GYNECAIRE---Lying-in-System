import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { parseFile } from './parser.js';
const require=createRequire(import.meta.url);let installed=true;try{for(const p of ['csv-parse','exceljs','yauzl'])require.resolve(p);}catch{installed=false;}
const options={skip:installed?false:'Parser dependencies unavailable: package proxy refuses installation'};
test('worker rejects empty, oversized and unsupported input without parser dependencies',async()=>{
 await assert.rejects(parseFile(Buffer.alloc(0),'empty.csv'));
 await assert.rejects(parseFile(Buffer.alloc(8*1024*1024+1),'large.csv'));
 for(const filename of ['test.sql','test.xls','test.pdf','test.json'])await assert.rejects(parseFile(Buffer.from('synthetic'),'bad-'+filename));
});
test('CSV: BOM, quoted Unicode, empty cells and 10,000 rows',options,async()=>{
 const data=await parseFile(Buffer.from('\ufeffFull Name,Patient Number,DOB\r\n"Synthetic, María",P-1,\r\n'),'register.csv');assert.deepEqual(data.rows,[['Synthetic, María','P-1','']]);
 const big='Name,Number\n'+Array.from({length:10000},(_,i)=>`Synthetic ${i},P-${i}`).join('\n');assert.equal((await parseFile(Buffer.from(big),'large.csv')).rows.length,10000);await assert.rejects(parseFile(Buffer.from(big+'\nExtra,P-extra'),'too-large.csv'));
});
test('malformed quotes, invalid UTF-8, unsupported formats and empty files',options,async()=>{
 for(const [bytes,name] of [[Buffer.from('a,b\n"unclosed,x'),'bad.csv'],[Buffer.from([0xff,0xfe]),'bad.csv'],[Buffer.from('SELECT 1'),'bad.sql'],[Buffer.alloc(0),'empty.csv']] as const)await assert.rejects(parseFile(bytes,name));
});
test('XLSX: dates, formula rejection and multiple worksheet rejection',options,async()=>{
 const ExcelJS=require('exceljs');const book=new ExcelJS.Workbook();const sheet=book.addWorksheet('Register');sheet.addRow(['Full Name','Patient Number','DOB']);sheet.addRow(['Synthetic Person','OLD-1',new Date('2000-01-02T00:00:00Z')]);sheet.getCell('C2').numFmt='yyyy-mm-dd';
 const parsed=await parseFile(Buffer.from(await book.xlsx.writeBuffer()),'register.xlsx');assert.equal(parsed.rows[0]![2],'2000-01-02');sheet.getCell('A2').value={formula:'1+1',result:2};await assert.rejects(parseFile(Buffer.from(await book.xlsx.writeBuffer()),'formula.xlsx'));sheet.getCell('A2').value='Synthetic';book.addWorksheet('Extra');await assert.rejects(parseFile(Buffer.from(await book.xlsx.writeBuffer()),'multiple.xlsx'));
});
