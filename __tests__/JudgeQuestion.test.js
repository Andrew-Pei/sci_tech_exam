const JudgeQuestion = require('../models/JudgeQuestion');

describe('JudgeQuestion 判断题类', () => {
  let trueQuestion;
  let falseQuestion;

  beforeEach(() => {
    trueQuestion = new JudgeQuestion(
      'judge_1',
      '这是一个正确的陈述',
      true
    );
    
    falseQuestion = new JudgeQuestion(
      'judge_2',
      '这是一个错误的陈述',
      false
    );
  });

  test('应该正确创建判断题实例', () => {
    expect(trueQuestion.id).toBe('judge_1');
    expect(trueQuestion.question).toBe('这是一个正确的陈述');
    expect(trueQuestion.type).toBe('judge');
    expect(trueQuestion.correctAnswer).toBe(true);

    expect(falseQuestion.id).toBe('judge_2');
    expect(falseQuestion.question).toBe('这是一个错误的陈述');
    expect(falseQuestion.type).toBe('judge');
    expect(falseQuestion.correctAnswer).toBe(false);
  });

  test('getCorrectAnswer() 应该返回正确答案', () => {
    expect(trueQuestion.getCorrectAnswer()).toBe(true);
    expect(falseQuestion.getCorrectAnswer()).toBe(false);
  });

  test('validateAnswer() 应该正确验证答案', () => {
    // 测试正确答案为 true 的情况
    expect(trueQuestion.validateAnswer(true)).toBe(true);
    expect(trueQuestion.validateAnswer(false)).toBe(false);

    // 测试正确答案为 false 的情况
    expect(falseQuestion.validateAnswer(false)).toBe(true);
    expect(falseQuestion.validateAnswer(true)).toBe(false);
  });

  test('getInfo() 应该返回完整的题目信息', () => {
    const trueInfo = trueQuestion.getInfo();
    expect(trueInfo).toEqual({
      id: 'judge_1',
      question: '这是一个正确的陈述',
      type: 'judge',
      correctAnswer: true
    });

    const falseInfo = falseQuestion.getInfo();
    expect(falseInfo).toEqual({
      id: 'judge_2',
      question: '这是一个错误的陈述',
      type: 'judge',
      correctAnswer: false
    });
  });

  test('fromJSON() 应该从 JSON 数据创建判断题实例', () => {
    const trueJsonData = {
      question: 'JSON 创建的正确问题',
      answer: true
    };

    const falseJsonData = {
      question: 'JSON 创建的错误问题',
      answer: false
    };

    const trueQuestionFromJson = JudgeQuestion.fromJSON(trueJsonData, 'json_judge_1');
    const falseQuestionFromJson = JudgeQuestion.fromJSON(falseJsonData, 'json_judge_2');

    expect(trueQuestionFromJson.id).toBe('json_judge_1');
    expect(trueQuestionFromJson.question).toBe('JSON 创建的正确问题');
    expect(trueQuestionFromJson.type).toBe('judge');
    expect(trueQuestionFromJson.correctAnswer).toBe(true);

    expect(falseQuestionFromJson.id).toBe('json_judge_2');
    expect(falseQuestionFromJson.question).toBe('JSON 创建的错误问题');
    expect(falseQuestionFromJson.type).toBe('judge');
    expect(falseQuestionFromJson.correctAnswer).toBe(false);
  });

  test('应该处理布尔值的严格比较', () => {
    // 测试非严格布尔值
    expect(trueQuestion.validateAnswer(1)).toBe(false); // 数字 1 不是布尔值 true
    expect(trueQuestion.validateAnswer('true')).toBe(false); // 字符串 'true' 不是布尔值 true
    expect(falseQuestion.validateAnswer(0)).toBe(false); // 数字 0 不是布尔值 false
    expect(falseQuestion.validateAnswer('false')).toBe(false); // 字符串 'false' 不是布尔值 false
  });

  test('应该处理空值和未定义值', () => {
    expect(trueQuestion.validateAnswer(null)).toBe(false);
    expect(trueQuestion.validateAnswer(undefined)).toBe(false);
    expect(falseQuestion.validateAnswer(null)).toBe(false);
    expect(falseQuestion.validateAnswer(undefined)).toBe(false);
  });
});