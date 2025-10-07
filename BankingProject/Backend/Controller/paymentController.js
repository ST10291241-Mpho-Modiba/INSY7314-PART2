import {processPayment} from '../Services/paymentService.js'

export const  ProcessPayments = async(req,res)=>{
try{    
    const {amount,currency,recipient} =req.body;
    const result = await processPayment({amount,currency,recipient});
    res.status(201).json({result});  
}catch(err){
    res.status(400).json({error: err.message})
}
}

export default ProcessPayments;