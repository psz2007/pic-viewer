function readTextFile(file, ext, callback, isLocked = false) {
    let xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/" + ext);
    xhr.open("GET", file, isLocked);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            callback(xhr.responseText, xhr.status);
        }
    }
    xhr.send();
}

var data = {}, dts = [];
function refreshData() {
    let lst = [];
    readTextFile("../random-pic/list.json", "json", function (txt, sta) {
        try {
            if (sta === 200) {
                lst = JSON.parse(txt);
            } else {
                console.error(sta);
                throw "爬取图片列表失败。";
            }
        } catch (e) {
            alert(e);
        }
    });
    data = {}, dts = [];
    for (let i in lst) {
        let w = lst[i].split('/'), dt = w[2], nm = w[w.length - 1], pth = "/" + w.slice(3, w.length - 1).join('/');
        if (data[dt] === undefined) {
            data[dt] = {};
            data[dt].cnt = 0;
            dts.push({
                date: dt
            });
        }
        if (data[dt][pth] == undefined) {
            data[dt][pth] = [];
        }
        data[dt][pth].push(nm);
        data[dt].cnt++;
    }
    for (let i in dts) {
        dts[i].message = `(${data[dts[i].date].cnt})`;
        dts[i].date = new Date(dts[i].date);
    }
}
function getData(re = true) {
    if (localStorage["pic-view-data"] == undefined || re) {
        refreshData();
        localStorage.clear();
        localStorage["pic-view-data"] = JSON.stringify(data);
        localStorage["pic-view-dts"] = JSON.stringify(dts);
    } else {
        data = JSON.parse(localStorage["pic-view-data"]);
        dts = JSON.parse(localStorage["pic-view-dts"]);
    }
}
function buildMainPage() {
    document.getElementById("main").innerHTML =
        `<div class="ui calendar" id="standard_calendar">
        <div class="ui input left icon">
            <i class="calendar icon"></i>
            <input type="text" placeholder="输入日期" id="date">
        </div>
        <button class="ui button" onclick="jumpToDate()">
            跳转
        </button>
    </div>`;
    getData();
    $('#standard_calendar').calendar({
        type: 'date',
        eventDates: dts,
        formatter: {
            date: 'YYYY.M.D'
        }
    });
}

function jumpToDate() {
    let dt = document.getElementById("date").value;
    if (data[dt] == undefined) {
        alert("这天没有图图");
    } else {
        const urlp = new URLSearchParams(window.location.search);
        urlp.set("dt", dt);
        window.location.search = urlp;
    }
}

function showLib() {
    getData();
    document.getElementById("main").innerHTML = `<div class="ui grid" id="pic-list"></div>`;
    const urlp = new URLSearchParams(window.location.search);
    let t = urlp.get("dt");
    for (let i in data[t]) {
        if (i == "cnt")
            continue;
        let tmp = document.createElement("div");
        tmp.setAttribute("class", "ui four wide column");
        tmp.innerHTML =
            `<div class='ui card'>
            <div class='content'>
                <a class='header' href='?dt=${t}&pth=${i.replaceAll("/", "_")}&id=0'>${i}:${data[t][i].length}</a>
            </div>
        </div>`;
        document.getElementById("pic-list").appendChild(tmp);
    }
}
function initMenu(x, cnt) {
    let s = `<a class='item' onclick='backToLib()'><i class='backward icon'></i></a><a class='item' onclick='jumpToId(1)'><i class='angle double left icon'></i></a>`;
    x++;
    if (x < 1 || x > cnt)
        return;
    if (x > 1)
        s += `<a class='item' onclick='jumpToId(${x - 1})'><i class='caret left icon'></i></a>`;
    if (x > 4)
        s += `<a class='item'><i class='ellipsis horizontal icon'></i></a>`;
    let l = Math.max(1, x - 3), r = Math.min(cnt + 1, x + 3);
    for (let i = l; i < r; i++)
        s += `<a class='item' onclick='jumpToId(${i})'>${i}</a>`;
    if (x < cnt - 3)
        s += `<a class='item'><i class='ellipsis horizontal icon'></i></a>`;
    if (x < cnt)
        s += `<a class='item' onclick='jumpToId(${x + 1})'><i class='caret right icon'></i></a>`;
    s += `<a class='item' onclick='jumpToId(${cnt})'><i class='angle double right icon'></i></a>`;
    return s;
}
function showPic() {
    getData();
    const urlp = new URLSearchParams(window.location.search);
    let t = urlp.get("dt"), p = urlp.get("pth").replaceAll("_", "/"), c = urlp.get("id");
    let lst = data[t][p];
    document.getElementById("main").innerHTML = `<div class='ui borderless menu'>${initMenu(c, lst.length)}</div><img src="../random-pic/pic/${t}${p}/${lst[c]}" style="max-width: -webkit-fill-available; width: 100%;">`;
}
function jumpToId(i) {
    const urlp = new URLSearchParams(window.location.search);
    if (urlp.get("id") == null) {
        return;
    }
    urlp.set("id", i - 1);
    window.location.search = urlp;
}
function backToLib() {
    const urlp = new URLSearchParams(window.location.search);
    if (urlp.get("id") == null) {
        return;
    }
    urlp.delete("id");
    urlp.delete("pth");
    window.location.search = urlp;
}

function showRandPic() {
    getData();
    if (!dts.length) {
        alert("图片导入失败");
        return;
    }
    let cnt = 0;
    for (let i in dts) {
        cnt += parseInt(/(\d+)/.exec(dts[i].message));
    }
    let p = Math.floor(Math.random() * cnt);
    for (let i in data) {
        if (i == "cnt")
            continue;
        for (let j in data[i]) {
            if (j == "cnt")
                continue;
            if (p < data[i][j].length) {
                document.getElementById("main").innerHTML =
                    `<div><img src="../random-pic/pic/${i}${j}/${data[i][j][p]}" style="max-width: -webkit-fill-available; width: 100%;"></div>`;
                return;
            } else {
                p -= data[i][j].length;
            }
        }
    }
    alert("!");
}
