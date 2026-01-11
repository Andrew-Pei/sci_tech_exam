const Question = require('./Question');

/**
 * 选择题类
 * 继承自Question基类
 */
class ChoiceQuestion extends Question {
    /**
     * 构造函数
     * @param {string} id - 题目ID
     * @param {string} question - 问题文本
     * @param {Array<string>} options - 选项数组
     * @param {string} correctAnswer - 正确答案（如"A", "B", "C", "D"）
     */
    constructor(id, question, options, correctAnswer) {
        super(id, question, 'choice');
        this.options = options;
        this.correctAnswer = correctAnswer;
    }

    /**
     * 验证答案
     * @param {string} userAnswer - 用户答案
     * @returns {boolean} 是否正确
     */
    validateAnswer(userAnswer) {
        return userAnswer.toUpperCase() === this.correctAnswer.toUpperCase();
    }

    /**
     * 获取选项
     * @returns {Array<string>} 选项数组
     */
    getOptions() {
        return this.options;
    }

    /**
     * 获取正确答案
     * @returns {string} 正确答案
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
            options: this.options,
            correctAnswer: this.correctAnswer
        };
    }

    /**
     * 从JSON对象创建选择题实例
     * @param {object} data - JSON数据
     * @param {string} id - 题目ID
     * @returns {ChoiceQuestion} 选择题实例
     */
    static fromJSON(data, id) {
        return new ChoiceQuestion(
            id,
            data.question,
            data.options,
            data.answer
        );
    }
}

module.exports = ChoiceQuestion;