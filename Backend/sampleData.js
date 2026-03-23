const sampleComplaints = [
    {
        id: 'GS-2024-001',
        title: 'Street light not working near Rajiv Gandhi Colony',
        category: 'streetlight',
        status: 'inprogress',
        date: '2024-01-15',
        ward: 'Ward 3',
        priority: 'high',
        progress: 60,
        assignedTo: 'Ravi Kumar',
        citizenName: 'Arjun Reddy',
        userEmail: 'arjun@example.com',
        description: 'Three street lights near Rajiv Gandhi Colony main road are not functioning for the past 5 days causing safety issues at night.',
        timeline: [
            { step: 'Complaint Filed', date: '2024-01-15', done: true, desc: 'Complaint received and registered.' },
            { step: 'Assigned to Staff', date: '2024-01-16', done: true, desc: 'Assigned to electrician Ravi Kumar.' },
            { step: 'Under Inspection', date: '2024-01-18', done: false, active: true, desc: 'Site visit scheduled.' }
        ],
    },
    {
        id: 'GS-2024-002',
        title: 'Drainage blockage causing overflow on Main Street',
        category: 'sanitation',
        status: 'pending',
        date: '2024-01-20',
        ward: 'Ward 5',
        priority: 'high',
        progress: 15,
        assignedTo: 'Unassigned',
        citizenName: 'K. Venkat',
        userEmail: 'venkat@example.com',
        description: 'The drainage near the main street market is completely blocked and sewage water is overflowing.',
    },
    {
        id: 'GS-2024-003',
        title: 'Water supply disrupted for 3 days in Ambedkar Nagar',
        category: 'water',
        status: 'resolved',
        date: '2024-01-10',
        ward: 'Ward 1',
        priority: 'medium',
        progress: 100,
        assignedTo: 'Suresh Reddy',
        citizenName: 'Lakshmi Rao',
        userEmail: 'lakshmi@example.com',
        description: 'Water supply has been disrupted for 3 consecutive days.',
    },
    {
        id: 'GS-2024-004',
        title: 'Pothole on School Road causing accidents',
        category: 'road',
        status: 'pending',
        date: '2024-01-22',
        ward: 'Ward 2',
        priority: 'medium',
        progress: 5,
        citizenName: 'Ravi Teja',
        userEmail: 'ravi.t@example.com',
    },
    {
        id: 'GS-2024-005',
        title: 'Garbage not collected for 1 week in Nehru Nagar',
        category: 'sanitation',
        status: 'inprogress',
        date: '2024-01-18',
        ward: 'Ward 4',
        priority: 'low',
        progress: 40,
        assignedTo: 'Naveen Raj',
        citizenName: 'Sunita G.',
        userEmail: 'sunita@example.com',
    },
    {
        id: 'GS-2024-006',
        title: 'Street light pole damaged by wind',
        category: 'streetlight',
        status: 'resolved',
        date: '2024-01-05',
        ward: 'Ward 6',
        priority: 'low',
        progress: 100,
        assignedTo: 'Ravi Kumar',
        citizenName: 'Prasad Babu',
        userEmail: 'prasad@example.com',
    },
];

const sampleTaxes = [
    // ── Arjun Reddy — citizen ────────────────────────────────
    // 2022-23 (all paid)
    {
        id: 'TAX-2022-001',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'house',
        amount: '₹1,000',
        year: '2022-23',
        status: 'paid',
        date: '12 Mar 2023'
    },
    {
        id: 'TAX-2022-002',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'water',
        amount: '₹300',
        year: '2022-23',
        status: 'paid',
        date: '12 Mar 2023'
    },
    // 2023-24 (all paid)
    {
        id: 'TAX-2023-001',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'house',
        amount: '₹1,200',
        year: '2023-24',
        status: 'paid',
        date: '10 Feb 2024'
    },
    {
        id: 'TAX-2023-002',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'water',
        amount: '₹360',
        year: '2023-24',
        status: 'paid',
        date: '10 Feb 2024'
    },
    {
        id: 'TAX-2023-003',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'trade',
        amount: '₹2,500',
        year: '2023-24',
        status: 'paid',
        date: '25 Jan 2024'
    },
    // 2024-25 (pending)
    {
        id: 'TAX-2024-001',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'house',
        amount: '₹1,500',
        year: '2024-25',
        status: 'pending',
        date: '—'
    },
    {
        id: 'TAX-2024-002',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'water',
        amount: '₹400',
        year: '2024-25',
        status: 'pending',
        date: '—'
    },
    {
        id: 'TAX-2024-003',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'trade',
        amount: '₹3,000',
        year: '2024-25',
        status: 'pending',
        date: '—'
    },
    // 2025-26 (pending — current year)
    {
        id: 'TAX-2025-001',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'house',
        amount: '₹1,800',
        year: '2025-26',
        status: 'pending',
        date: '—'
    },
    {
        id: 'TAX-2025-002',
        userEmail: 'vickymunagapati@gmail.com',
        userName: 'Vicky Munagapati',
        type: 'water',
        amount: '₹450',
        year: '2025-26',
        status: 'pending',
        date: '—'
    },
];

const sampleUsers = [
    {
        name: 'Arjun Reddy',
        email: 'arjun@example.com',
        password: 'password123',
        role: 'citizen'
    },
    {
        name: 'Ravi Kumar',
        email: 'ravi@example.com',
        password: 'password123',
        role: 'staff',
        department: 'Electricity',
        designation: 'Electrician'
    },
    {
        name: 'Suresh Reddy',
        email: 'suresh@example.com',
        password: 'password123',
        role: 'staff',
        department: 'General',
        designation: 'Field Officer'
    },
    {
        name: 'Naveen Raj',
        email: 'naveen@example.com',
        password: 'password123',
        role: 'staff',
        department: 'Sanitation',
        designation: 'Sanitation Lead'
    },
    {
        name: 'Gopal Rao',
        email: 'gopal@example.com',
        password: 'password123',
        role: 'staff',
        department: 'Water Supply',
        designation: 'Plumber'
    },
    {
        name: 'Vikram Rao',
        email: 'vikram@example.com',
        password: 'password123',
        role: 'staff',
        department: 'Infrastructure',
        designation: 'Road Inspector'
    },
    {
        name: 'Lakshmi Devi',
        email: 'lakshmi.d@example.com',
        password: 'password123',
        role: 'staff',
        department: 'Health',
        designation: 'Health Inspector'
    },
    {
        name: 'Sarpanch Garu',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin'
    }
];

const sampleAnnouncements = [
    {
        title: 'Gram Sabha Meeting – February 28, 2024',
        date: 'Feb 20, 2024',
        body: 'All villagers are requested to attend the Gram Sabha on Feb 28 at the Panchayat Hall. Agenda: Sanitation drive, road repair updates, and welfare scheme enrollment.',
        category: 'Meeting',
        icon: 'campaign'
    },
    {
        title: 'Water Supply Maintenance on March 2',
        date: 'Feb 18, 2024',
        body: 'There will be no water supply from 7 AM to 1 PM on March 2 due to pipeline maintenance.',
        category: 'Notice',
        icon: 'water_drop'
    },
    {
        title: 'Scholarship Applications Open',
        date: 'Feb 15, 2024',
        body: 'SC/ST students from Class 5–12 can apply for the state government scholarship. Last date: March 15.',
        category: 'Welfare',
        icon: 'school'
    },
    {
        title: 'Road Repair Work in Ward 2 & 3',
        date: 'Feb 10, 2024',
        body: 'Road repair work will commence on Feb 25. Traffic diversions apply. Estimated completion: 10 days.',
        category: 'Infrastructure',
        icon: 'construction'
    }
];

const samplePensions = [
    {
        id: 'PEN-2024-001',
        name: 'Arjun Reddy',
        userEmail: 'arjun@example.com',
        type: 'oldage',
        ward: 'Ward 3',
        amount: '₹2,500',
        status: 'active',
        since: 'Jan 2023',
        aadhaar: 'XXXX-XXXX-1234'
    },
    {
        id: 'PEN-2024-002',
        name: 'S. Ramulu',
        userEmail: 'ramulu@example.com',
        type: 'disability',
        ward: 'Ward 1',
        amount: '₹3,000',
        status: 'active',
        since: 'Mar 2022',
        aadhaar: 'XXXX-XXXX-5678'
    }
];

const sampleCertificates = [
    {
        id: 'CERT-2024-001',
        type: 'income',
        name: 'Arjun Reddy',
        userEmail: 'arjun@example.com',
        status: 'approved',
        appliedDate: '15 Jan 2024',
        approvedDate: '20 Jan 2024'
    },
    {
        id: 'CERT-2024-002',
        type: 'caste',
        name: 'K. Venkat',
        userEmail: 'venkat@example.com',
        status: 'pending',
        appliedDate: '01 Feb 2024'
    }
];

module.exports = {
    sampleComplaints,
    sampleTaxes,
    sampleUsers,
    sampleAnnouncements,
    samplePensions,
    sampleCertificates
};
