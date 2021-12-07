# curricula-variable-assistant
A webpage assisting you with your curriculum arrangement.

# 东南大学选课助手
帮你选出不冲突的课程
网页版：[https://quadnucyard.github.io/curricula-variable-assistant/index.html](https://quadnucyard.github.io/curricula-variable-assistant/index.html)

## 使用方法
在选课页面打开 F12，在[网络]中找到名为 `list` 的文件，复制其"响应"中的 JSON 数据，粘贴到输入数据的对话框，即可导入。

导入数据后可建立课程列表，选择课程即可更新课程表，会检查冲突。点选择的课程即退选。

# ChangeLog

## v0.1
创建项目，支持简单的选课并显示在课表。

## v0.2
实现选择使用预设，可以导入源数据，但无法编辑。

## v0.3
用 `Vue.js` 重构。

### v0.3.1
继续完善课程的手动增删