const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },  
    apps: [
        {
            name: { 
                type: String, 
                required: true 
            },    
            url: { 
                type: String, 
                required: true 
            }
        }
    ]    
});

const Pump = mongoose.model('Pump', pumpSchema);

module.exports = Pump;
