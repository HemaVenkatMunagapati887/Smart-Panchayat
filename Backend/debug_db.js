const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

async function checkData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/smartpanchayat');
        const cat = await Complaint.aggregate([
            { $group: { _id: '$category', value: { $sum: 1 } } }
        ]);
        console.log('Category Breakdown:', JSON.stringify(cat));

        const count = await Complaint.countDocuments();
        console.log('Total Complaints:', count);

        const all = await Complaint.find({}).limit(5).select('category');
        console.log('Sample Complaints:', JSON.stringify(all));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkData();
