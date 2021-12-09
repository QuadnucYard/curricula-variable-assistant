//要考虑一下这些存哪
//一个预设有一套，但不跟着存

class ClassSession {
    raw; //原始字符串分成的数组
    cid; //课程代号
    cno; //课程代号
    week; //周
    day; //周几
    tStart; //开始时间
    tEnd; //结束时间
    classroom; //教室

    static tpDict = new Map();

    constructor(week, day, tStart, tEnd, classroom) {
        this.week = week;
        this.day = day;
        this.tStart = tStart;
        this.tEnd = tEnd;
        this.classroom = classroom;
    }

    get ordinal() {
        let base = (this.week - 1) * 91 + this.day * 13;
        return [base + this.tStart, base + this.tEnd];
    }

    get span() {
        return this.tEnd - this.tStart + 1;
    }

    static mapDay(str) {
        const mapday = {
            "星期一": 0,
            "星期二": 1,
            "星期三": 2,
            "星期四": 3,
            "星期五": 4,
            "星期六": 5,
            "星期日": 6
        }
        return mapday[str];
    }

    toHtml() {
        let h = getHashCode(this.cid) % 360;
        return (
            `<div class="session-label" style="background-color: hsl(${h},80%,90%); border-color: hsl(${h},50%,80%);">
            <p>${CurriculaPreset.getCourse(this.cid).cname}-${this.cno}</p>
            <p>${this.raw[3]}</p>
            <p>${CurriculaPreset.getCourse(this.cid).at(this.cno).teacher}</p>
        </div>`);
    }

    toOverallHtml() {
        let h = getHashCode(this.cid) % 360;
        return (
            `<div class="session-label" style="background-color: hsl(${h},80%,90%); border-color: hsl(${h},50%,80%);">
            <p>${CurriculaPreset.getCourse(this.cid).cname}-${this.cno}</p>
            <p>${this.raw[0]}</p>
            <p>${this.raw[1]} ${this.raw[2]}</>
            <p>${this.raw[3]}</p>
            <p>${CurriculaPreset.getCourse(this.cid).at(this.cno).teacher}</p>
        </div>`);
    }

    //解析教学时间地点的字符串
    static resolveTeachingPlace(course_id, class_id, teachingPlace) {
        if (ClassSession.tpDict.has(teachingPlace)) {
            return ClassSession.tpDict.get(teachingPlace);
        }
        //console.log("resolve",teachingPlace);
        //有一个问题，周后面的内容可能会省略
        if (!teachingPlace || teachingPlace == "undefined") return [];
        let sp = teachingPlace.split(",").filter(t => t != undefined).map(str => str.split(" "));
        for (let i = sp.length - 1; i >= 0; i--) {
            if (sp[i].length <= 1) sp[i][1] = sp[i + 1][1];
            if (sp[i].length <= 2) sp[i][2] = sp[i + 1][2];
            if (sp[i].length <= 3) sp[i][3] = sp[i + 1][3];
        }
        ClassSession.tpDict.set(teachingPlace, sp.map(s => {
            let weekstr;
            let step = 1;
            if (s[0].endsWith(")")) {
                weekstr = s[0].substr(0, s[0].length - 4);
                step = 2;
            } else {
                weekstr = s[0].substr(0, s[0].length - 1);
            }
            let [t1, t2] = weekstr.split("-").map(t => parseInt(t));
            let arr = [];
            for (; t1 <= t2; t1 += step) {
                let ses = new ClassSession(
                    t1,
                    ClassSession.mapDay(s[1]),
                    ...(s[2].substr(0, s[2].length - 1).split("-").map(t => parseInt(t) - 1)),
                    s[3]
                );
                ses.cid = course_id;
                ses.cno = class_id;
                ses.raw = s;
                arr.push(ses);
            }
            return arr;
        }).flat().sort((a, b) => compareInt(a.ordinal[0], b.ordinal[0])));
        return ClassSession.tpDict.get(teachingPlace);
    }
}

class SubcourseData {
    cid;
    cno;
    cname;
    place;
    sessions;
    sessionMask;
}

class CourseData {
    //为了便于处理，没有子课程的XGKC也加上tcList

    cid;
    cname;
    cunit;
    ctype;
    credit;
    hours;

    at(x) { return this.tcList.find(t => t.no == x); }

    constructor(o) {
        Object.assign(this, o);
    }

    induceSubcourse(no) {
        let ret = { subcourse: this.at(no) };
        Object.assign(ret, this);
        return ret;
    }

    static parseTJKC(json) {
        let ret = new CourseData();
        Object.assign(ret, {
            cid: String(json["KCH"]),
            cname: String(json["KCM"]),
            ccat: String(json["KCLB"]),
            cunit: String(json["KKDW"]),
            ctype: String(json["KCXZ"]),
            credit: Number(json["XF"]),
            hours: Number(json["XS"] || json["hours"]),
            tcList: json["tcList"].map(t => Object({
                no: String(t["KXH"]),
                teacher: String(t["SKJS"]),
                place: String(t["place"] || t["teachingPlace"]),
            })),
        });
        return ret;
    }

    static parseTYKC(json) {
        let ret = new CourseData();
        Object.assign(ret, {
            cid: json["KCH"],
            cname: json["KCM"],
            ccat: json["KCLB"],
            cunit: json["KKDW"],
            ctype: json["KCXZ"],
            credit: Number(json["XF"]),
            hours: Number(json["XS"] || json["hours"]),
            tcList: json["tcList"].map(t => Object({
                no: t["KXH"],
                teacher: t["SKJS"],
                place: t["place"] || t["teachingPlace"],
                sportcode: t["sportCode"],
                sportname: t["sportName"],
            })),
        });
        return ret;
    }

    static parseXGKC(json) { //决定不对这个做特别区分
        let ret = new CourseData();
        Object.assign(ret, {
            cid: json["KCH"],
            cname: json["KCM"],
            ccat: json["KCLB"],
            cunit: json["KKDW"],
            ctype: json["KCXZ"],
            credit: Number(json["XF"]),
            hours: Number(json["XS"] || json["hours"]),
            tcList: [{
                no: json["KXH"],
                teacher: json["SKJS"],
                place: json["place"] || json["teachingPlace"]
            }]
        });
        return ret;
    }
}

