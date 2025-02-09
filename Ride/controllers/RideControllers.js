const {publishToQueue} =require("../services/rabbit") ;
const Ride = require("../models/ride.model") ;
module.exports.createRide = async (req, res) => {
    try{
        const {source,destination} = req.body;
        const user = req.user;
        console.log(user);
        const ride = new Ride({
            user:user.id,
            source,
            destination
        });
        await ride.save();
        publishToQueue("new-ride",JSON.stringify(ride));
        res.status(201).json({message:"Ride created successfully",ride});
    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal server error"});
    }
};

module.exports.updateRide = async (req, res) => {
    try{
        const {rideId} = req.query;
        const captain = req.captain;
        const ride = await Ride.findOne({_id:rideId});
        if(!ride){
            return res.status(404).json({message:"Ride not found"});
        }
        ride.status = "accepted";
        ride.captain = captain.id;
        await ride.save();
        publishToQueue("ride-accepted",JSON.stringify(ride));
        res.status(200).json({message:"Ride updated successfully",ride});
}
catch(err){
    console.log(err);
    res.status(500).json({message:"Internal server error"});
}
};