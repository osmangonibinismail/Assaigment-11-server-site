const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173','http://localhost:5174','https://oai-food-corner.web.app','https://oai-food-corner.firebaseapp.com',
    ],
    credentials: true,
    optionsSuccessStatus: 200.
}));
app.use(express.json());
app.use(cookieParser())

console.log(process.env.DB_PASS)

// verify jwt middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access'})
            if (token) {
                jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                    if (err) {
                        console.log(err)
                        return res.status(401).send({message: 'unauthorized access'})
                    }
                    console.log(decoded)
                    req.user = decoded
                    next()
                })
            }
};
const cookieOption ={
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cgjyhyw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // collection set up
        const addFoodCollection = client.db('oaiFoodCorner').collection('food')
        const reqestCollection = client.db('oaiFoodCorner').collection('request')
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // jwt generate
        app.post('/jwt', async (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '365d'
            })
            res.cookie('token', token, cookieOption)
                .send({ success: true })
        })
        // clear token log out
        app.get('/logout', (req, res) => {
            res
                .clearCookie('token',{ ...cookieOption,maxAge: 0} )
                .send({ success: true })
        })
        // app.post('/logout', async (req, res) => {
        //     const user = req.body;
        //     console.log('logging out', user);
        //     res
        //         .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
        //         .send({ success: true })
        //  })
        // All available food 
        app.get('/allAvailableFood', async (req, res) => {
            const cursor = addFoodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // available food
        // app.get('/allAvailableFood', async(req, res) => {
        //     const filter = req.query;
        //     console.log(filter)
        //     // const query = {
        //     //     title: {$regex: filter.search, $options: 'i'}
        //     // };
        //     // const options = {
        //     //     sort: {
        //     //         expiredDate: filter.sort === 'asc' ? 1: -1
        //     //     }
        //     // }
        //     const cursor = addFoodCollection.find(query, options);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })
    
        app.post('/featuredFood', async(req, res) => {
            const featuredItem = req.body;
            console.log(featuredItem);
            const result = await addFoodCollection.insertOne(featuredItem);
            res.send(result);
        });
        // add food post
        app.post("/addFood", async (req, res) => {
            console.log(req.body);
            const result = await addFoodCollection.insertOne(req.body);
            console.log(result);
            res.send(result)
        })
        // manage my food page
        app.get("/myFood/:email",  async (req, res) => {
            console.log(req.params.email);
            const result = await addFoodCollection.find({ email: req.params.email }).toArray();
            res.send(result);
        })
        // request food
        app.post('/requested', async (req, res) => {
            const requestDoc = req.body;
            console.log(requestDoc)
            const result = await addFoodCollection.insertOne(requestDoc);
            res.send(result)

        })
        app.get('/requested/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.params.email;
            if (tokenEmail !== email) {
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = { email: email }
            const result = await addFoodCollection.find(query).toArray();
            res.send(result)
        })
        // update available button
        app.patch('requested/:id',  async (req, res) => {
            const id = req.params.id
            const foodStatus = req.body
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: foodStatus,
            }
            const result = await addFoodCollection.updateOne(query, updateDoc)
            res.send(result)
        })
        
        
        // changeLayout
        // app.get('/allAvailableFood', async (req, res) => {
        //     const filter = req.query.filter
        //     const sort = req.query.sort
        //     const search = req.query.search

        //     let query = {
        //         foodName: {$regex: search, $options: 'i'},
        //     }
        //     if (filter ) query = {...query, category: filter}
        //     let options = {}
        //     if (sort) options = { sort: {expiredDate: sort === 'asc' ? 1 : -1}}
        //     const cursor = addFoodCollection.find(options);
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })
        // change layout
        app.get('/changeLayout', async (req, res) => {
            const cursor = addFoodCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // single food details
        app.get("/singleFoodDetails/:id", async (req, res) => {
            console.log(req.params.id);
            const result = await addFoodCollection.findOne({
                _id: new ObjectId(req.params.id),
            });
            console.log(result);
            res.send(result);
        })
        // update page
        app.get("/singleFood/:id", async (req, res) => {
            console.log(req.params.id);
            const result = await addFoodCollection.findOne({
                _id: new ObjectId(req.params.id),
            });
            console.log(result);
            res.send(result);
        })
        app.put("/updateFood/:id",  async (req, res) => {
            console.log(req.params.id)
            const query = { _id: new ObjectId(req.params.id) };
            const data = {
                $set: {
                    foodName: req.body.foodName,
                    foodImageURL: req.body.foodImageURL,
                    foodQuantity: req.body.foodQuantity,
                    foodStatus: req.body.foodStatus,
                    expiredDate: req.body.expiredDate,
                    pickupLocation: req.body.pickupLocation,
                    additionalNotes: req.body.additionalNotes,
                }
            }
            const result = await addFoodCollection.updateOne(query, data);
            console.log(result, req.body);
            res.send(result)
        })

        // delete
        app.delete("/delete/:id", async (req, res) => {
            const result = await addFoodCollection.deleteOne({
                _id: new ObjectId(req.params.id)
            })
            console.log(result);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Assaigment 11 is running')
})

app.listen(port, () => {
    console.log(`Assaigment 11 server site is running on port ${port}`)
})