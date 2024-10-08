const fs = require('fs');
const main_view = fs.readFileSync('./main.html', 'utf-8');
const orderlist_view = fs.readFileSync('./orderlist.html', 'utf-8');

const mariadb = require('./database/connect/mariadb');

function main(response) {
   mariadb.query('select * from product', function (err, rows) {
      console.log(rows);
   });

   response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
   });
   response.write(main_view);
   response.end();
}

function orderlist(response) {
   response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
   });
   mariadb.query('select * from orderlist', function (err, rows) {
      console.log('orderList!!!!');
      console.log(rows);
      response.write(orderlist_view);

      rows.forEach((element) => {
         response.write(
            '<tr>' +
               '<td>' +
               element.product_id +
               '</td>' +
               '<td>' +
               element.order_date +
               '</td>' +
               '</tr>',
         );
      });
      response.write('</table></body></html>'); // 테이블 종료 및 HTML 종료
      response.end();
   });
}

function redRacket(response) {
   fs.readFile('./img/redRacket.png', function (err, data) {
      response.writeHead(200, {
         'Content-Type': 'text/html; charset=utf-8',
      });
      response.write(data);
      response.end();
   });
}
function blueRacket(response) {
   fs.readFile('./img/blueRacket.png', function (err, data) {
      response.writeHead(200, {
         'Content-Type': 'text/html; charset=utf-8',
      });
      response.write(data);
      response.end();
   });
}
function blackRacket(response) {
   fs.readFile('./img/blackRacket.png', function (err, data) {
      response.writeHead(200, {
         'Content-Type': 'text/html; charset=utf-8',
      });
      response.write(data);
      response.end();
   });
}

function order(response, productId) {
   response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
   });

   mariadb.query(
      'insert into orderlist VALUES (' +
         productId +
         ", '" +
         new Date().toLocaleDateString() +
         "')",
      function (err, rows) {
         console.log(rows);
      },
   );

   response.write('order page<br>');
   response.write('Racket 주문이 완료되었습니다.<br>');
   response.write('주문 페이지를 확인하세요.');
   response.end();
}

let handle = {};

handle['/main'] = main;
handle['/order'] = order;
handle['/orderlist'] = orderlist;

handle['/img/redRacket.png'] = redRacket;
handle['/img/blueRacket.png'] = blueRacket;
handle['/img/blackRacket.png'] = blackRacket;

exports.handle = handle;
