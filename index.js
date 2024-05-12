const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS)

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
    const addFoodCollection =client.db('oaiFoodCorner').collection('food')
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // add food post
    app.post("/addFood", async(req, res) => {
        console.log(req.body);
        const result = await addFoodCollection.insertOne(req.body);
        console.log(result);
        res.send(result)
    })
    // manage my food page
    app.get("/myFood/:email", async (req, res) =>{
        console.log(req.params.email);
        const result = await addFoodCollection.find({email:req.params.email}).toArray()
        res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', ( req, res) => {
    res.send('Assaigment 11 is running')
})

app.listen(port, () => {
    console.log(`Assaigment 11 server site is running on port ${port}`)
})