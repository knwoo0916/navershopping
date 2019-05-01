const express = require('express');
const http = require('http');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser'); //여기
const qs = require('querystring');
const iconv = require('iconv-lite');  //인코딩 변환도구
const charset = require('charset');  //캐릭터셋 체크 도구
const mysql = require('mysql');
const dbinfo = require('./dbinfo');

/* mysql 연결부분 */
const conn = mysql.createConnection({
    user: "yy_30215",
    password: "1234",
    host: "gondr.asuscomm.com"
});
conn.query("USE yy_30215"); //yy_30215 데이터베이스 사용
let app = express();

app.set('port', 12000);

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json()); //미들웨어로 바디파서를 사용함. //여기
app.use(bodyParser.urlencoded({ extended: true })); //여기

app.get('/', function (req, res) {
    res.render('main', { msg: 'Welcome To Express4' });
});

app.get('/top10', function (req, res) {
    let param = [req.body.title, req.body.content, req.body.writer];

    let sql = "INSERT INTO board (title, content, writer) VALUES(?, ?, ?)";
    conn.query(sql, param, function (err, result) {
        if (!err) {
            res.redirect('/board');
        }
    });

    request("https://search.shopping.naver.com/best100v2/main.nhn", function (err, response, body) {

        $ = cheerio.load(body);

        let top10 = $(".ranking_list > li");
        let list = [];
        for (let i = 0; i < top10.length; i++) {
            let ranking = $(top10[i]).find("em").text();
            let title = $(top10[i]).find("._popular_srch_lst_li").text();
            let vary = $(top10[i]).find(".vary").text();
            let ranking_link = $(top10[i]).find(".txt > a").text();
            list.push({ ranking: ranking, title: title, vary: vary, ranking_link: ranking_link });
        }
        res.render('top', { list: list });
    });
});


app.get('/search', function (req, res) {
    res.render('search', {});
});

app.post('/search', function (req, res) {
    let word = req.body.word;
    word = qs.escape(word);
    let url = "https://search.shopping.naver.com/search/all.nhn?query=" + word + "&cat_id=&frm=NVSHATC";
    request(url, function (err, response, body) {

        $ = cheerio.load(body);

        let product_list = $(".goods_list > li");
        let list = [];
        for (let i = 0; i < product_list.length; i++) {
            let title = $(product_list[i]).find(".info > .tit").text();
            let price = $(product_list[i]).find(".info > .price > em").text();
            let category = $(product_list[i]).find(".info > .depth").text();
            let detail = $(product_list[i]).find(".info > .detail").text();
            let review = $(product_list[i]).find(".info > .etc").text();

            let link = $(product_list[i]).find(".info > a").attr("href");
            let img = $(product_list[i]).find(".img_area > a > ._productLazyImg").attr("data-original");
            let zoom = $(product_list[i]).find(".zoom").attr("data-nv-mid");
            list.push({ title: title, price: price, category: category, detail: detail, review: review, link: link, img: img, zoom: zoom });
        }
        res.render('search', { list: list });
    });
});
app.get('/board', function (req, res) {
    for (let i = 0; i <= 10; i++) {
        let k;
        if(i >= 10) {
            k = i;
        } else {
            k = "0" + i;
        }
        let url = "https://search.shopping.naver.com/search/category.nhn?pagingIndex=1&pagingSize=40&viewType=list&sort=rel&cat_id=500000" + k + "&frm=NVSHCAT";
        request(url, function (err, response, body) {

            $ = cheerio.load(body);

            let product_list = $(".container_inner");
            let list = [];

            let ct_num = i;
            let ct_name = $(product_list).find(".pic a").text();
            let ct_result = $(product_list).find("._productSet_total").text().replace("\n\t\t\t\t\t\t\t\t\t전체", "");

            list = [[ct_num, ct_name, ct_result]];
            console.log([list]);
            let sql = "INSERT INTO shopping(ct_num, ct_name, ct_result) VALUES ?;";
            conn.query(sql, [list], function (err, result, fields) { });
        });
    }
    let sql = "SELECT * FROM shopping;";
    conn.query(sql, function(err, result) {
        res.render('board', {msg: '카테고리별 검색결과 수', list: result});
    })
});
app.get('/datalab2', function (req, res) {
    res.render('datalab2', {});

    // for (let i = 0; i <= 10; i++) {
    //     let k;
    //     if(i >= 10) {
    //         k = i;
    //     } else {
    //         k = "0" + i;
    //     }
    //     let url = "https://search.shopping.naver.com/search/category.nhn?pagingIndex=1&pagingSize=40&viewType=list&sort=rel&cat_id=500000" + k + "&frm=NVSHCAT";
    //     request(url, function (err, response, body) {

    //         $ = cheerio.load(body);

    //         let product_list = $(".container_inner");
    //         let list = [];

    //         let ct_num = i;
    //         let ct_name = $(product_list).find(".pic a").text();
    //         let ct_result = $(product_list).find("._productSet_total").text();

    //         list = [[ct_num, ct_name, ct_result]];
    //         console.log([list]);
    //         let sql = "INSERT INTO shopping(ct_num, ct_name, ct_result) VALUES ?;";
    //         conn.query(sql, [list], function (err, result, fields) { });
    //     });
    // }
    // let data = [
    //     {
    //         "groupName": "마우스",
    //         "keywords": [
    //             "로지텍",
    //             "Razor",
    //             "맥스틸",
    //             "Maxtill"
    //         ]
    //     },
    //     {
    //         "groupName": "걸그룹",
    //         "keywords": [
    //             "트와이스",
    //             "Twice",
    //             "아이즈원",
    //             "IzOne"
    //         ]
    //     },
    //     {
    //         "groupName": "보이그룹",
    //         "keywords": [
    //             "엑소",
    //             "BTS",
    //             "빅뱅",
    //             "버닝썬"
    //         ]
    //     }
    // ];

    // datalab("2019-02-01", "2019-04-30", "week", data, function (result) {
    //     let colors = ["rgb(255, 192, 192)", "rgb(75, 192, 255)", "rgb(75, 255, 128)"];

    //     let gData = {
    //         "labels": [

    //         ], "datasets": [

    //         ]
    //     };

    //     let r = result.results;

    //     for (let i = 0; i < r.length; i++) {

    //         let item = {
    //             "label": r[i].title,
    //             "borderColor": colors[i],
    //             "fill": false,
    //             "lineTension": 0.2,
    //             "data": []
    //         };

    //         for (let j = 0; j < r[i].data.length; j++) {
    //             item.data.push(r[i].data[j].ratio);
    //             if (i == 0) {
    //                 let date = r[i].data[j].period;
    //                 let arr = date.split("-");
    //                 gData.labels.push(arr[1] + arr[2]);
    //             }

    //         }

    //         gData.datasets.push(item);

    //     }

    //     res.render('datalab2', {
    //         g: gData
    //     });
    // });

});

let server = http.createServer(app);
server.listen(app.get('port'), function () {
    console.log(`Express 엔진이 ${app.get('port')}에서 실행중`);
});