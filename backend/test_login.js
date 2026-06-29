const http = require('http');
const data = JSON.stringify({email:'admin@stempal.com',password:'admin123'});
const req = http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}}, res => {
  let body='';
  res.on('data',c=>body+=c);
  res.on('end',()=>{console.log('Status:', res.statusCode); console.log('Response:', body);});
});
req.write(data);
req.end();
