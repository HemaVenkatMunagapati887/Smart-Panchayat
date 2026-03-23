const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Complaint = require('./models/Complaint');
const Tax = require('./models/Tax');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const Pension = require('./models/Pension');
const Certificate = require('./models/Certificate');
const { sampleComplaints, sampleTaxes, sampleUsers, sampleAnnouncements, samplePensions, sampleCertificates } = require('./sampleData');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();
        await Complaint.deleteMany();
        await Tax.deleteMany();
        await User.deleteMany();
        await Announcement.deleteMany();
        await Pension.deleteMany();
        await Certificate.deleteMany();

        // Transform sample data to match model if needed, but model was built to match it
        await Complaint.insertMany(sampleComplaints);
        await Tax.insertMany(sampleTaxes);
        await Announcement.insertMany(sampleAnnouncements);
        await Pension.insertMany(samplePensions);
        await Certificate.insertMany(sampleCertificates);
        // Important: User.insertMany will trigger the 'pre save' hook for password hashing if we create them one by one, 
        // but insertMany doesn't trigger 'pre save' usually with standard options. 
        // Actually, for seeding, we can just hash them manually or use create in a loop.
        for (let u of sampleUsers) {
            await User.create(u);
        }

        console.log('Data (Complaints, Taxes, Users) Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
