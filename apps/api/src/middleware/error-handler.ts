import type { ErrorRequestHandler } from 'express';
// Never echo request bodies, database errors, credentials or stack traces.
export const apiErrorHandler:ErrorRequestHandler=(error,_req,res,next)=>{
 if(res.headersSent){next(error);return;}
 const kind=typeof error==='object'&&error!==null&&'type' in error?error.type:'';
 const status=kind==='entity.too.large'?413:kind==='entity.parse.failed'?400:500;
 res.status(status).json({error:status===413?'Request exceeds the permitted size.':status===400?'Request body could not be read. Please check the form and retry.':'The clinic service could not complete this request.'});
};
