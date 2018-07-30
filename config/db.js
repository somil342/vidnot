if(process.env.NODE_ENV == 'production'){
    module.exports={mongoURI:
    'mongodb://abhay:Mlab@1996@ds159661.mlab.com:59661/vidnot-dev'} 
}else{
    module.exports={mongoURI:
    'mongodb://localhost/vidjot-dev'} 
}