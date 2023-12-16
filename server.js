
const express = require('express');
const bodyParser = require('body-parser');
const { Worker} = require('worker_threads');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

function mergeSortedArrays(arr, half) {
  const temp = [...arr];
  let i = 0, j = half, k = 0;

  while (i < half && j < temp.length) {
    if (temp[i] < temp[j]) {
      arr[k] = temp[i];
      i++;
    } else {
      arr[k] = temp[j];
      j++;
    }
    k++;
  }

  while (i < half) {
    arr[k] = temp[i];
    i++;
    k++;
  }

  while (j < temp.length) {
    arr[k] = temp[j];
    j++;
    k++;
  }
}

function sortArray(inputArray, callback) {
  inputArray.sort((a, b) => a - b);
  callback(null, inputArray);
}

function sortConcurrent(inputArray, callback) {
  const half = Math.ceil(inputArray.length / 2);
  const worker1 = new Worker(sortArray, { workerData: inputArray.slice(0, half) });
  const worker2 = new Worker(sortArray, { workerData: inputArray.slice(half) });

  let sortedArray1, sortedArray2;

  worker1.on('message', (result) => {
    sortedArray1 = result;
    if (sortedArray2) {
      mergeSortedArrays(inputArray, half);
      callback(null, inputArray);
    }
  });

  worker2.on('message', (result) => {
    sortedArray2 = result;
    if (sortedArray1) {
      mergeSortedArrays(inputArray, half);
      callback(null, inputArray);
    }
  });
}

app.post('/process-single', (req, res) => {
  const inputArray = req.body.inputArray;
  const startTime = new Date();

  sortArray(inputArray, (err, sortedArray) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      const endTime = new Date();
      const duration = endTime - startTime;
      res.json({ sortedArray, timeTaken: duration });
    }
  });
});

app.post('/process-concurrent', (req, res) => {
  const inputArray = req.body.inputArray;
  const startTime = new Date();

  sortConcurrent(inputArray, (err, sortedArray) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      const endTime = new Date();
      const duration = endTime - startTime;
      res.json({ sortedArray, timeTaken: duration });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
