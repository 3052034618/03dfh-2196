export default defineAppConfig({
  pages: [
    'pages/taskHall/index',
    'pages/review/index',
    'pages/feedback/index',
    'pages/publishTask/index',
    'pages/taskDetail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#7B5CFF',
    navigationBarTitleText: '漫画分镜审稿',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#7B5CFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/taskHall/index',
        text: '任务大厅'
      },
      {
        pagePath: 'pages/review/index',
        text: '审稿'
      },
      {
        pagePath: 'pages/feedback/index',
        text: '意见'
      }
    ]
  }
})
