const Question = require('../models/Question');

// 创建一个测试用的子类来测试抽象基类
class TestQuestion extends Question {
  constructor(id, question, type, correctAnswer) {
    super(id, question, type);
    this.correctAnswer = correctAnswer;
  }

  validateAnswer(userAnswer) {
    return userAnswer === this.correctAnswer;
  }

  getCorrectAnswer() {
    return this.correctAnswer;
  }
}

describe('Question 基类', () => {
  let question;

  beforeEach(() => {
    question = new TestQuestion('test_1', '测试问题', 'test', 'correct');
  });

  test('应该正确创建题目实例', () => {
    expect(question.id).toBe('test_1');
    expect(question.question).toBe('测试问题');
    expect(question.type).toBe('test');
  });

  test('getInfo() 应该返回题目信息', () => {
    const info = question.getInfo();
    expect(info).toEqual({
      id: 'test_1',
      question: '测试问题',
      type: 'test'
    });
  });

  test('toJSON() 应该返回 JSON 格式的题目信息', () => {
    const json = question.toJSON();
    expect(json).toEqual({
      id: 'test_1',
      question: '测试问题',
      type: 'test'
    });
  });

  test('子类应该实现 validateAnswer 方法', () => {
    expect(() => {
      const abstractQuestion = new Question('abstract_1', '抽象问题', 'abstract');
      abstractQuestion.validateAnswer('test');
    }).toThrow('validateAnswer方法必须在子类中实现');
  });

  test('子类可以正确验证答案', () => {
    const result = question.validateAnswer('correct');
    expect(result).toBe(true);
    
    const wrongResult = question.validateAnswer('wrong');
    expect(wrongResult).toBe(false);
  });
});