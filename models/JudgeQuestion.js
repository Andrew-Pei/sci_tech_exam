const Question = require('./Question');

/**
 * 判断题类
 * 继承自Question基类
 */
class JudgeQuestion extends Question {
    /**
     * 构造函数
     * @param {string} id - 题目ID
     * @param {string} question - 问题文本
     * @param {boolean} correctAnswer - 正确答案（true/false）
     */
    constructor(id, question, correctAnswer) {
        super(id, question, 'judge');
        this.correctAnswer = correctAnswer;
    }

    /**
     * 验证答案
     * @param {boolean} userAnswer - 用户答案
     * @returns {boolean} 是否正确
     */
    validateAnswer(userAnswer) {
        return userAnswer === this.correctAnswer;
    }

    /**
     * 获取正确答案
     * @returns {boolean} 正确答案
     */
    getCorrectAnswer() {
        return this.correctAnswer;
    }

    /**
     * 获取题目信息
     * @returns {object} 题目信息
     */
    getInfo() {
        return {
            ...super.getInfo(),
            correctAnswer: this.correctAnswer
        };
    }

    /**
     * 从JSON对象创建判断题实例
     * @param {object} data - JSON数据
     * @param {string} id - 题目ID
     * @returns {JudgeQuestion} 判断题实例
     */
    static fromJSON(data, id) {
        return new JudgeQuestion(
            id,
            data.question,
            data.answer
        );
    }
}

module.exports = JudgeQuestion;