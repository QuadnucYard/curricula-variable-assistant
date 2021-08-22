
const CourseCategory = Object.freeze({
    TJKC: "TJKC",
    TYKC: "TYKC",
    XGKC: "XGKC"
});

class CurriculaPreset {
    name;
    TJKC;
    TYKC;
    XGKC;

    constructor(name) {
        this.name = name;
    }

    static #parseRawJson(jsonstr) {
        //这里需要解决一个问题，如果输入是多个json连接起来的，需要分别解析
        let json;
        try {
            json = jsonstr.split(/(?<=})\s*(?={)/).flatMap(t => JSON.parse(t)["data"]["rows"]);
        } catch (error) {
            console.log("err");
            return [];
        }
        console.log(json);
        return json;
    }

    //从原始数据包里生成
    static parseTJKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseTJKC(t));
    }

    static parseTYKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseTYKC(t));
    }

    static parseXGKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseXGKC(t));
    }
}

var presets = [];
var curPreset = null;
var curPresetCategory = null;

//可能需要一个PresetManager
class PresetManager {


    static load() {

    }

    static add(preset) {
        presets.push(preset);
        $("#editor-select-user-preset").append(`<option>${preset.name}</option>`)
        $("#preset-selector").append(`<option>${preset.name}</option>`)
        $("#editor-select-user-preset").val(preset.name);
        PresetManager.show(preset);
    }

    static remove(preset) {
        let index = presets.indexOf(preset);
        presets.removeAt(index);
        if (preset == curPreset) {
            if (presets.length == 0) {
                this.show(null);
            } else {
                this.show(index == presets.length ? presets[index - 1] : presets[index]);
            }
        }
        $(`#editor-select-user-preset > option:eq(${index})`).remove();
        $(`#preset-selector > option:eq(${index})`).remove();
        if (curPreset) {
            $("#editor-select-user-preset").val(curPreset.name);
            $("#preset-selector").val(curPreset.name);
        }
    }

    //显示预设，具体到课程类别
    //这里的 preset 是 courseData 的数组
    static show(preset, category = CourseCategory.TJKC) {
        console.log("show", preset, category);
        if (!preset) {
            curPreset = null;
            $("#preset-course-list > li").remove();
            return;
        }

        if (category == curPresetCategory && preset == curPreset) return;

        curPreset = preset;
        $("#preset-selector").val(curPreset.name);

        curPresetCategory = category;
        let subpreset = preset[category];
        //需要针对类别讨论
        $("#preset-course-list > li").remove();
        if (category != CourseCategory.XGKC) {
            $("#preset-course-list > div").before(
                `${subpreset.map(t =>
                    `<li data-cid="${t.cid}">
                        <div>
                            <span>${t.cid}</span>
                            <span>${t.cname}</span>
                            <span>${t.ccat}</span>
                            <span>${t.cunit}</span>
                            <span>${t.ctype}</span>
                        </div>
                        <ul>
                            ${t.tcList.map(u =>
                        `<li data-cno="${u.no}">
                                <span>${u.no}</span>
                                ${category == CourseCategory.TYKC ? `<span>${u.sportName}</span>` : ""}
                                <span>${u.teacher}</span>
                                <span>${u.teachingPlace}</span>
                            </li>`).join("")}
                            <div>
                                <input data-cno placeholder="编号" style="width: 60;">
                                <input data-teacher placeholder="教师" style="width: 100;">
                                <input data-place placeholder="课程时间地点" style="width: 400;">
                                <button>增加</button>
                            </div>
                        </ul>
                    </li>`
                ).join("")}`
            );
        } else {
            $("#preset-course-list > div").before(
                `${subpreset.map(t =>
                    `<li data-cid="${t.cid}">
                        <div>
                            <span>${t.cid}</span>
                            <span>${t.cname}</span>
                            <span>${t.ccat}</span>
                            <span>${t.cunit}</span>
                            <span>${t.ctype}</span>
                            <span>${t.teacher}</span>
                            <span>${t.teachingPlace}</span>
                        </div>
                    </li>`
                ).join("")}`
            );
        }
        //点击事件
        $("#preset-course-list > li > ul > div > button").click(function () {
            let inputData = $(this).parent();
            $(this).parent().before(
                `<li data-cno="${inputData.children("input[data-cno]").val()}">
                <span>${inputData.children("input[data-cno]").val()}</span>
                <span>${inputData.children("input[data-teacher]").val()}</span>
                <span>${inputData.children("input[data-place]").val()}</span>
            </li>`
            );
            //还要处理数据
        });
        $("#preset-course-list > div > button").click(function () {
            let inputData = $(this).parent();
            console.log(inputData)
            $(this).parent().before(
                `<li data-cid="${inputData.find("input[data-cid]").val()}">
            <div>
                <span>${inputData.find("div input[data-cid]").val()}</span>
                <span>${inputData.find("input[data-cname]").val()}</span>
                <span>${inputData.find("input[data-cunit]").val()}</span>
                <span>${inputData.find("select[data-ctype]").val()}</span>
            </div>
            <ul>
                <div>
                    <input data-cno placeholder="编号" style="width: 60;">
                    <input data-teacher placeholder="教师" style="width: 100;">
                    <input data-place placeholder="课程时间地点" style="width: 400;">
                    <button>增加</button>
                </div>
            </ul>                    
        </li>`
            );
        });
    }

    static addCourse(cdata) {

    }

    static addClass() {

    }

    static loadUserPresets() {
        if (localStorage.getItem("userPresets")) {
            presets = JSON.parse(localStorage.getItem("userPresets"));
            $("#preset-selector").html(
                presets.map(t => `<option>${t.name}</option>`).join("")
            );
            $("#editor-select-user-preset").html(
                presets.map(t => `<option>${t.name}</option>`).join("")
            );
        } else {
            presets = [];
        }
        this.show(presets[0]);
    }

    static saveUserPresets() {
        localStorage.setItem("userPresets", JSON.stringify(presets))
    }
}

