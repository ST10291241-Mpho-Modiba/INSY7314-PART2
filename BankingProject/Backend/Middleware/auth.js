import jwt from 'jsonwebtoken'

const auth = (req,res,next) => {
const authHeader = req.headers.authorization;
if(!authHeader||!authHeader.startsWith('Bearer ')){
    return res.status(401).json({message: "Authorization hearder does not include Bearer"})
}
const token = authHeader.split(' ')[1];
try{
    const decodjwt = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodjwt;
    next();
}catch(err){
    return res.status(401).json({message: err.message})
}
}
export default auth