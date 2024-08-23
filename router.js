function route(pathname, handle, response, productId) {
   console.log('pathname : ' + pathname);

   if (typeof handle[pathname] === 'function') {
      handle[pathname](response, productId);
   } else {
      response.writeHead(404, { 'Content-Type': 'text-html' });
      response.write('찾으시는 페이지가 없습니다.');
      response.end();
   }
}

exports.route = route;
