/**
 * 题目基类
 * 所有题目类型的抽象基类
 */
class Question {
    /**
     * 构造函数
     * @param {string} id - 题目ID
     * @param {string} question - 问题文本
     * @param {string} type - 题目类型
     */
    constructor(id, question, type) {
        this.id = id;
        this.question = question;
        this.type = type;
    }

    /**
     * 验证答案
     * @param {any} userAnswer - 用户答案
     * @returns {boolean} 是否正确
     */
    validateAnswer(userAnswer) {
        throw new Error('validateAnswer方法必须在子类中实现');
    }

    /**
     * 获取题目信息
     * @returns {object} 题目信息
     */
    getInfo() {
        return {
            id: this.id,
            question: this.question,
            type: this.type
        };
    }

    /**
     * 转换为JSON对象
     * @returns {object} JSON对象
     */
    toJSON() {
        return this.getInfo();
    }
}

module.exports = Question;