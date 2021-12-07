const compareInt = (a, b) => a < b ? -1 : (b < a ? 1 : 0);
var sessionDict = new Map(); //其实这个应该跟着课程走，预先解析所有课程的数据

const ConflictStatus = Object.freeze({
    None: 0,
    Psuedo: 1,
    Proper: 2
});


class Timetable {

    hostPreset; //使用的预设
    #choosen = null; //三维数组，每个时段是否被占用，存储的是某课程某时间段的数据
    #courseChoice = new Map();

    constructor() {
        //周-日-节  第0周存储总体?
        //this.#choosen = new Array(17).fill(new Array(7).fill(new Array(13).fill(null)));
        this.#choosen = Array.from({ length: 17 }, () => Array.from({ length: 7 }, () => Array.from({ length: 13 }, () => null)));
    }

    checkSessionConflict(session) {
        for (let i = session.tStart; i <= session.tEnd; i++) {
            if (this.#choosen[session.week][session.day][i])
                return true;
        }
        return false;
    }

    checkCourseConflict(course_id, class_id) {
        return this.hostPreset.getSessions(course_id, class_id)
            .some(t => this.checkSessionConflict(t));
    }

    getCourseConflicts(course_id, class_id) {
        //console.log("getconf", arguments);
        let set = new Set();

        for (let session of this.hostPreset.getSessions(course_id, class_id)) {
            for (let i = session.tStart; i <= session.tEnd; i++) {
                if (this.#choosen[session.week][session.day][i])
                    set.add(this.#choosen[session.week][session.day][i].cid + "-" + this.#choosen[session.week][session.day][i].cno);
            }
        }
        return set;
    }

    //选课
    chooseCourse(course_id, class_id) {
        //console.log("chooseCourse", course_id, class_id);
        if (this.checkCourseConflict(course_id, class_id)) return false;
        for (let session of this.hostPreset.getSessions(course_id, class_id)) {
            for (let i = session.tStart; i <= session.tEnd; i++) {
                this.#choosen[session.week][session.day][i] = session;
            }
        }
        //console.log("select", course_id, class_id);
        this.#courseChoice.set(course_id, class_id);
        return true;
    }

    //退课
    dropCourse(course_id, class_id) {
        //console.log("drop", course_id, class_id);
        let sessions = this.hostPreset.getSessions(course_id, class_id);
        for (let session of sessions) {
            for (let i = session.tStart; i <= session.tEnd; i++) {
                this.#choosen[session.week][session.day][i] = null;
            }
        }
        this.#courseChoice.delete(course_id);
    }

    getCourseChoice(course_id) {
        return this.#courseChoice.get(course_id);
    }

    toHtml(week) {
        return (
            `<tr>
                <th>节次/星期</th>
                <th>星期一</th>
                <th>星期二</th>
                <th>星期三</th>
                <th>星期四</th>
                <th>星期五</th>
                <th>星期六</th>
                <th>星期日</th>
            </tr>
            ${range(0, 13).map(t =>
                `<tr>
                    <td>${t + 1}</td>
                    ${range(0, 7).map(u =>
                    !this.#choosen[week][u][t] ? "<td></td>" :
                        t > 0 && this.#choosen[week][u][t] == this.#choosen[week][u][t - 1] ?
                            "" : `<td rowspan="${this.#choosen[week][u][t].span}">${this.#choosen[week][u][t].toHtml()}</td>`
                ).join("")}
                </tr>`).join("")}`);
    }

    toOverallHtml() {
        //把每周上午、下午、晚上的汇总起来
        let maps = Array.from({ length: 7 }, () => Array.from({ length: 3 }, () => new Map()));
        for (let i = 1; i <= 16; i++) { //枚举周
            for (let j = 0; j < 7; j++) { //枚举日
                for (let k = 0; k < 5; k++) //枚举上午下午晚上的课
                    if (this.#choosen[i][j][k] && !maps[j][0].has(this.#choosen[i][j][k].cid))
                        maps[j][0].set(this.#choosen[i][j][k].cid, this.#choosen[i][j][k]);
                for (let k = 5; k < 10; k++)
                    if (this.#choosen[i][j][k] && !maps[j][1].has(this.#choosen[i][j][k].cid))
                        maps[j][1].set(this.#choosen[i][j][k].cid, this.#choosen[i][j][k]);
                for (let k = 10; k < 13; k++)
                    if (this.#choosen[i][j][k] && !maps[j][2].has(this.#choosen[i][j][k].cid))
                        maps[j][2].set(this.#choosen[i][j][k].cid, this.#choosen[i][j][k]);
            }
        }

        return (
            `<tr>
                <th>节次/星期</th>
                <th>星期一</th>
                <th>星期二</th>
                <th>星期三</th>
                <th>星期四</th>
                <th>星期五</th>
                <th>星期六</th>
                <th>星期日</th>
            </tr>
            ${range(0, 13).map(t =>
                `<tr>
                    <td>${t + 1}</td>
                    ${range(0, 7).map(u =>
                    t == 0 ? `<td rowspan="5" style="vertical-align: top;">${[...maps[u][0].values()].map(v => v.toOverallHtml()).join("")}</td>` :
                        t == 5 ? `<td rowspan="5" style="vertical-align: top;">${[...maps[u][1].values()].map(v => v.toOverallHtml()).join("")}</td>` :
                            t == 10 ? `<td rowspan="3" style="vertical-align: top;">${[...maps[u][2].values()].map(v => v.toOverallHtml()).join("")}</td>` :
                                ""
                ).join("")}
                </tr>`).join("")}`);
    }


}

//课程规划

class Scheduler {
    timetable = new Timetable();
    curPresetCategory;
    scheduleShownMode;
    curWeek=-1;

    switchPreset(preset) {
        if (this.timetable.hostPreset == preset) return;
        this.timetable.hostPreset = preset;
        console.log("switch", this.timetable.hostPreset);
        this.curPresetCategory = null;
        //然后初始化界面
        this.showCourseList();
    }

    showCourseList(category = CourseCategory.TJKC) {
        console.log("showCourseList", this.timetable.hostPreset, category);
        let preset = this.timetable.hostPreset;
        if (!preset) {
            return;
        }
        if (category == this.curPresetCategory) return;

        this.curPresetCategory = category;
        let subpreset = preset.data[category];
        $("ul.clist").html(
            `${subpreset.map(u =>
                `<li id="${u.cid}">
                        <div>
                            <span>
                                <span style="display: inline-block; color: #2C7AD6; width: 5.5em;">${u.cid}</span>
                                <span style="display: inline-block">${u.cname}</span>
                            </span>
                            <span style="float: right">
                                <span style="display: inline-block; color: #9d3dcf; margin-right: 0.4em;">${u.ctype}</span>
                            </span>
                        </div>
                        <ul>${u.tcList.map(t =>
                    `<li id="${u.cid}-${t.no}" class="">
                                <span class="tag-caption text-center" style="background-color: #13C2C2; width: 1em">${t.no}</span>
                                <span class="tag-caption text-center" style="background-color: #3498DB; width: ${t.teacher ? Math.floor((t.teacher.length + 2) / 3) * 3 : 3}em">${t.teacher}</span>
                                <span class="tag-caption" style="background-color: #F39C11">${t.place}</span>
                            </li>`).join("")}
                        </ul>
                    </li>`).join("")}`
        );

        $("ul.clist li div").click(function (event) { scheduler.toggleCourseDisplay($(this).parent().attr("id")); });
        $("ul.clist li ul li").click(function (event) { scheduler.selectCourse1(this.id); });
        this.initTimetable();
    }

    initTimetable() {
        this.updateTimetable(this.scheduleShownMode == 0 ? this.curWeek : 0);
    }

    updateTimetable(week) {
        $("div#timetable-area table").html(week == 0 ? this.timetable.toOverallHtml() : this.timetable.toHtml(week));
    }

    toggleCourseDisplay(course_id) {
        let tar = $(`li#${course_id} ul`);
        if (tar.css("display") == "none") tar.css("display", "");
        else tar.css("display", "none");
    }

    selectCourse1(course) {
        this.selectCourse(...course.split("-"));
    }

    selectCourse(course_id, class_id) {
        //console.log("selectCourse", course_id, class_id);
        //console.log(timetable.getCourseConflicts(course_id, class_id));
        //冲突的更新换个做法，先加上冲突，再上伪冲突
        let target = $(`li#${course_id}-${class_id}`);
        let selection = this.timetable.getCourseChoice(course_id);
        if (selection != undefined) this.timetable.dropCourse(course_id, selection);
        if (selection != class_id) {
            if (this.timetable.chooseCourse(course_id, class_id)) {
                target.addClass("selected");
                target.siblings().removeClass("selected");
            } else {
                window.alert("Course conflict!");
            }
        } else { //点了自己
            target.removeClass("selected");
        }
        //更新一下冲突
        //定义伪冲突：在同类课程中，如果去掉被选的那个导致其他可选，那么这个冲突就是伪冲突
        //console.log( this.timetable.hostPreset.dataMap.values());
        for (let course of this.timetable.hostPreset.dataMap.values()) {
            let selection = this.timetable.getCourseChoice(course.cid);
            //console.log(course);
            for (let cclass of course.tcList) {
                let target = $(`li#${course.cid}-${cclass.no}`);
                let conflicts = this.timetable.getCourseConflicts(course.cid, cclass.no);
                if (conflicts.size == 0 || conflicts.size == 1 && selection == cclass.no) {
                    target.removeClass("conflicting");
                    target.removeClass("pseudo-conflicting");
                } else if (conflicts.size == 1 && conflicts.values().next().value.startsWith(course.cid)) {
                    target.removeClass("conflicting");
                    target.addClass("pseudo-conflicting");
                } else {
                    target.addClass("conflicting");
                    target.removeClass("pseudo-conflicting");
                }
            }
        }
        this.initTimetable();
        //timetable.trace();
    }
}

var scheduler = new Scheduler();