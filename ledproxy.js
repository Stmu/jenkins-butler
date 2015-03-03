var http = require('http');
http.createServer(function(req, res) {
  console.log(req.method + " -> " + req.url + " -> " + req.body);
  if (req.method === "POST") {
    req.on('data', function(chunk) {
      console.log("Received body data:");
      console.log(chunk.toString());
    });

    req.on('end', function() {
      // empty 200 OK response for now
      res.writeHead(200, "OK", {
        'Content-Type': 'text/html'
      });
      res.end();
    });
  } else {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    res.end('OK\n');
  }
}).listen(3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3000/');
