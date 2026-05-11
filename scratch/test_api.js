const https = require('https');

https.get('https://api.qurancdn.com/api/qdc/verses/by_page/1?words=false&translations=131&per_page=50&fields=text_indopak', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    console.log(JSON.parse(data).verses[0]);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
