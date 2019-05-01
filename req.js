const request = require('request');
const cheerio = require('cheerio');
const icov = require('iconv-lite');
const charset = require('charset');

const option = {
    url : 'http://www.y-y.hs.kr/lunch.view?date=20190429',
    headers : {
        'User-Agent' : 'Mozilla/5.0'
    },
    encoding:null   //인코딩 값을 널로주어 별도의 인코딩을 하지 않게 한다
}

request(option, function (err, res, body) {
    if(err != null){
        console.log(err);
        return;
    }

    const enc = charset(res, headers, body);
    console.log(body);
    const result = iconv.decode(body, enc);

    $ = cheerio.load(body);
    let menu = $(".menuName > span");
    console.log(menu);
    console.log(menu.text());
});