const express = require('express');
const hbs = require('hbs');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const router = express.Router();
const mongoose = require('mongoose');
dotenv.config();

const app = express();
const port = 3700;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Set up Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the homepage
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Quick Grocery Delivery',
        siteName: 'QUICK GROCERY DELIVERY',
        stylesheet: '/styles.css',
        navItems: [
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
            { label: 'Products', url: '/products' },
            { label: 'Sign-Up', url: '/signup' },
        ],
        contactUrl: '/login',
        contactLabel: 'Login',
        images: ['/images/homepage2.png'],
        heroTitle: 'Quick Grocery Delivery',
        heroSubtitle: "Shop groceries online, we'll deliver to your door fast!",
        ctaUrl: '/products',
        ctaLabel: 'View Products',
        deliveryTitle: 'Your groceries, delivered swiftly',
        deliveryDescription: 'Quick Grocery Delivery brings the grocery store to your doorstep. Our personal pickers hand-select your items with care and deliver them right to you. Enjoy the convenience of adding items to your cart, tracking your order in real-time using Google Maps API, and sharing your feedback in our review section. Experience a new level of grocery shopping today!',
        deliveryLinkText: 'Get in touch',
        
        // Product array added to the context
        products: [
            {
                title: 'Fresh fruits',
                description: 'Savor the taste of handpicked, fresh fruits delivered to you.',
                image: '/images/fruits.png',
                link: '/fruits'
            },
            {
                title: 'Organic vegetables',
                description: 'Get farm-fresh organic vegetables delivered quickly and easily.',
                image: '/images/vegetables.png',
                link: '/vegetables'
            },
            {
                title: 'Dairy products',
                description: 'Indulge in our selection of fresh and creamy dairy products.',
                image: '/images/dairy.png',
                link: '/dairy'
            },
            {
                title: 'Bakery goods',
                description: 'Enjoy our selection of fresh bread, pastries, and baked goods, delivered right to your door.',
                image: '/images/dessert.png',
                link: '/bakery'
            },
            {
                title: 'Beverages',
                description: 'Quench your thirst with our range of refreshing drinks, juices, and more.',
                image: '/images/beverages.png',
                link: '/beverages'
            },
            {
                title: 'Snacks & Sweets',
                description: 'Satisfy your cravings with our delicious range of snacks and sweets.',
                image: '/images/snacks.png',
                link: '/snacks'
            }
        ],
        
        script: '/script.js'
    });
});
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    // You can add logic here to process the form, e.g., send an email or save the message
    console.log(`Received a message from ${name} (${email}): ${message}`);
    res.redirect('/'); // Redirect back to homepage or another page after form submission
});

app.use('/auth', require('./routes/auth'));
app.use('/otp', require('./routes/otp'));

app.post('/api/signup', (req, res) => {
    // Handle signup logic here, such as saving the user to the database
    // Respond with success or failure messages
    const { fullName, username, email, password } = req.body;
    // Mock response for demonstration
    res.status(200).json({ message: 'Signup successful!' });
});
app.get('/signup', (req, res) => {
    res.render('signup');  // Renders the signup.hbs file
});
app.get('/login', (req, res) => {
    res.render('login');  // Renders the login.hbs file
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('login', { error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('login', { error: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/index');  // Redirect to home page or dashboard after login
    } catch (error) {
        res.status(500).render('login', { error: 'Error logging in' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
