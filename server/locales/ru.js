// @ts-check

export default {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный адрес электронной почты или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать',
          success: 'Пользователь успешно зарегистрирован',
        },
        edit: {
          error: 'Не удалось изменить пользователя',
          success: 'Пользователь успешно изменен',
        },
        delete: {
          success: 'Пользователь успешно удален',
          error: 'Не удалось удалить пользователя',
        },
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      accessDenied: 'Вы не можете редактировать или удалять другого пользователя',
      suckerPunch: 'Tut, tut you naughty boy... you shouldn\'t do that',
    },
    layouts: {
      application: {
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Вход',
          submit: 'Войти',
        },
      },
      users: {
        id: 'ID',
        firstName: 'Имя',
        lastName: 'Фамилия',
        email: 'Email',
        password: 'Пароль',
        createdAt: 'Дата создания',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        actions: 'Действия',
        edit: 'Изменить',
        editUser: 'Изменение пользователя',
        editedAt: 'Дата изменения',
        delete: 'Удалить',
      },
      welcome: {
        index: {
          hello: 'Добро пожаловать!',
          description: 'Простая система управления. Позволяет ставить задачи, назначать исполнителей и менять их статусы.',
        },
      },
    },
  },
};
