const express = require('express')

const app = express();

const port = 3000;

 function handleFirstRequest(req, res){
    const ans = calculateSum(100)
    res.send(`The ans is ${ans}`);
 }


 app.get('/', handleFirstRequest)

 function started(){
    console.log(`Example app listening on port ${port}`)
 }

 app.get('/api', (req, res) => {
    res.send('whats up api')
 })

 app.listen(port, started)

// Express (library) lets you create http server in react

function calculateSum (counter){
    let sum = 0;
    for(let i = 0; i < counter; i++){
        sum += i;

    }

    return sum;
}

