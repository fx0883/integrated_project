import { request } from '../utils/request'

// CMS统计分析相关API
export const statisticsApi = {
  // 获取CMS概览统计数据
  getCmsOverview() {
    return request.get('/cms/statistics/overview/')
  },
  
  // 获取文章统计数据
  getArticleStatistics(params) {
    return request.get('/cms/statistics/articles/', params)
  },
  
  // 获取评论统计数据
  getCommentStatistics(params) {
    return request.get('/cms/statistics/comments/', params)
  },
  
  // 获取用户互动统计数据
  getInteractionStatistics(params) {
    return request.get('/cms/statistics/interactions/', params)
  },
  
  // 获取访问日志统计
  getAccessLogStatistics(params) {
    return request.get('/cms/statistics/access-logs/', params)
  },
  
  // 获取热门文章
  getPopularArticles(params) {
    return request.get('/cms/statistics/popular-articles/', params)
  },
  
  // 获取热门分类
  getPopularCategories(params) {
    return request.get('/cms/statistics/popular-categories/', params)
  },
  
  // 获取热门标签
  getPopularTags(params) {
    return request.get('/cms/statistics/popular-tags/', params)
  },
  
  // 获取访问来源统计
  getVisitSourceStatistics(params) {
    return request.get('/cms/statistics/visit-sources/', params)
  },
  
  // 获取设备统计
  getDeviceStatistics(params) {
    return request.get('/cms/statistics/devices/', params)
  },
  
  // 获取地理位置统计
  getLocationStatistics(params) {
    return request.get('/cms/statistics/locations/', params)
  },
  
  // 获取时间段统计
  getTimeRangeStatistics(params) {
    return request.get('/cms/statistics/time-ranges/', params)
  },
  
  // 获取自定义时间范围的统计数据
  getCustomRangeStatistics(startDate, endDate, type) {
    return request.get('/cms/statistics/custom-range/', {
      start_date: startDate,
      end_date: endDate,
      type: type
    })
  },
  
  // 导出统计数据
  exportStatistics(params) {
    return request.download('/cms/statistics/export/', params)
  }
}

export default statisticsApi 