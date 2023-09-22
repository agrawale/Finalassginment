
import express from "express";
import bodyParser from "body-parser";
import { v4 as uuid } from 'uuid';
import { Account } from "./Interfaces";
import { deposit } from "./Interfaces";
import { productPurchased } from "./Interfaces";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const app = express();
const PORT = 3000;

let SimulatedDay: number = 0;

app.use((req, res, next) => {
  const getHeader = req.rawHeaders;
  for (let i = 0; i < getHeader.length; i++) {
    if (getHeader[i] == 'Simulated-Day') {
      SimulatedDay = Number(req.rawHeaders[++i]);
      break;
    }
  }

  processDeposits(); // this is a scheduler, that will check any pending deposit. If yes, then it will add the balance to accounts

  next();
});

app.use(bodyParser.json());

// Array to store account information in memory
const accounts: Account[] = [];
const pendingdeposit: deposit[] = [];
const items: productPurchased[] = [];
const products = [
  {
    id: "solar",
    title: "Solar Panel",
    description: "Super duper Essent solar panel",
    stock: 10,
    price: 750,
  },
  {
    id: "insulation",
    title: "Insulation",
    description: "Cavity wall insulation",
    stock: 10,
    price: 2500,
  },
  {
    id: "heatpump",
    title: "Awesome Heatpump",
    description: "Hybrid heat pump",
    stock: 3,
    price: 5000,
  },
];

//To Push data into Accounts array
app.post('/accounts', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const account = { id: uuid(), name, balance: 0 };
  accounts.push(account);

  return res.status(200).json(account);
});


// Get all accounts
app.get('/accounts', (req, res) => {
  return res.status(200).json(accounts);
});


// Return account details with mentioned accountId
app.get('/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;

  const account = accounts.filter(acc => acc.id === accountId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  return res.status(200).json(account[0]);
});



//Deposit the money temporary for 1 day in pending deposit array and response is shown with current balance account
app.post('/accounts/:accountId/deposits', async (req, res) => {
  const { accountId } = req.params;
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const deposit = { depositId: uuid(), accountId: accountId, amount: amount, simulatedDay: SimulatedDay };
  pendingdeposit.push(deposit);

  // The below snippet will show the current balance (the one without the pending transaction added)
  const account: any = accounts.filter(acc => acc.id === accountId);

  return res.status(201).json(account[0]);

});

//Add the pending deposits to account after end of the day
const processDeposits = () => {

  for (const dep of pendingdeposit) {
    if (dep.simulatedDay < SimulatedDay) {
      const accId = dep.accountId;
      const account = accounts.filter(acc => acc.id === accId);
      account[0].balance += Number(dep.amount);
      dep.amount = 0;
    }
  }
};




//get all list of products
app.get('/products', (req, res) => {
  return res.status(200).json(products);
});



// add new products
app.post('/products', (req, res) => {
  const { title } = req.body;
  const { description } = req.body;
  const { price } = req.body;
  const { stock } = req.body;

  if (!title && !description && !price && !stock) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const product = { id: uuid(), title, description, price, stock };
  products.push(product);

  return res.status(201).json(product);
});


//get products per given id
app.get('/products/:productId', (req, res) => {
  const { productId } = req.params;

  const product = products.filter(prd => prd.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json(product[0]);
});


// For buying a new product
app.post('/accounts/:accountId/purchases', (req, res) => {

  const { productId } = req.body;
  const { accountId } = req.params;
  let latestSimulatedDay = 0;

  const account = accounts.filter(acc => acc.id === accountId);

  const product = products.filter(prd => prd.id === productId);

  if (product[0].stock === 0) {
    return res.status(409).json({ error: 'Not enough stock' });
  }

  if (account[0].balance < product[0].price) {
    return res.status(409).json({ error: 'Not enough funds' });
  }

  if (!productId) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const existingItem = items.find(item => item.accountId === accountId && item.productId === productId);
  if (existingItem) {
    latestSimulatedDay = existingItem.latestSimulatedDay;
  }

  // console.log(latestSimulatedDay);
  // console.log(SimulatedDay);

  if (latestSimulatedDay > SimulatedDay) {
    return res.status(400).json({ error: 'Simulated day illegal' });
  }
  else {
    const itemPurchased = {
      productId: productId,
      accountId: accountId,
      latestSimulatedDay: SimulatedDay
    }
    items.push(itemPurchased);
    product[0].stock -= 1;
    account[0].balance -= product[0].price;
    return res.sendStatus(201);
  }
}

);


//both the endpoints is for testing reasons
app.get('/pendingdeposits', (req, res) => {
  return res.status(200).json(pendingdeposit);
});

app.get('/items', (req, res) => {
  return res.status(200).json(items);
});




app.listen(PORT);



