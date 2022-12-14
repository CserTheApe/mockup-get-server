const fs = require("fs");
const express = require("express");

const DEFAULT_COUNT = 10;
const PORT = 8086;

function populateArray(item) {
  const count = isNaN(parseInt(item.count))
    ? DEFAULT_COUNT
    : parseInt(item.count);

  if (item.data.length === 0) return [];

  const finalData = [];
  let i = 0;
  while (finalData.length < count) {
    finalData.push(item.data[i]);
    i++;
    if (i >= item.data.length) i = 0;
  }
  return finalData;
}

function parameterSubstitution(inputData, placeholder, substitute) {
  if (!inputData) return;
  try {
    if (Array.isArray(inputData)) {
      inputData.forEach((item, index) => {
        if (typeof item === "object")
          parameterSubstitution(item, placeholder, substitute);
        else
          inputData[index] = inputData[index].replace(placeholder, substitute); //array of strings
      });
    } else {
      for (const itemKey of Object.keys(inputData)) {
        if (typeof inputData[itemKey] === "object") {
          parameterSubstitution(inputData[itemKey], placeholder, substitute);
        } else
          inputData[itemKey] = inputData[itemKey].replace(
            placeholder,
            substitute
          );
      }
    }
  } catch (e) {
    if (e.name !== "TypeError") {
      console.log("Error in parameter substitution");
      console.log("name", e.name);
    }
  }
}

function getData() {
  const filename = process.argv[2];

  const rawData = fs.readFileSync(filename);
  return JSON.parse(rawData);
}

function startServer(data) {
  const app = express();

  for (const item of data) {
    try {
      const loadedData = Array.isArray(item.data)
        ? populateArray(item)
        : item.data;

      app.get(item.path, (req, res) => {
        let responseData = JSON.parse(JSON.stringify(loadedData));

        const paramKeys = Object.keys(req.params);
        for (const key of paramKeys) {
          const placeholder = `{${key}}`;
          parameterSubstitution(responseData, placeholder, req.params[key]);
        }
        res.json(responseData);
      });
    } catch (e) {
      console.log("Error in JSON schema for an endpoint");
    }
  }

  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
}

function serve(data) {
  try {
    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    startServer(data);
  } catch (err) {
    console.log(`Mockup - ${err.name}`);
    console.log(err.message);
    console.log("Make sure you've passed a JSON file with a valid schema");
  }
}

function standAlone() {
  try {
    const data = getData();
    console.log(data);

    startServer(data);
  } catch (err) {
    console.log(`Mockup - ${err.name}`);
    console.log(err.message);
    console.log("Make sure you've passed a JSON file with a valid schema");
  }
}

if (require.main === module) {
  standAlone();
}

module.exports = serve;
