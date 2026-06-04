<template>
    <div>
      <el-table :data="tableData" height="500" style="width: 100%">
        <template slot="empty">
          <p>{{empty}}</p>
        </template>
        <el-table-column type="selection"> </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" sortable='custom' />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="level" label="level" />
     
        <!-- 操作 -->
        <el-table-column label="操作" width="220">
          <template slot-scope="level">
            <el-button size="small" @click="edit(scope.row,scope.$index)" type="primary">编辑</el-button>
            <el-button size="small" @click="remove(scope.row,scope.$index)" type="danger">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination">
      <el-pagination
        background
        layout="total,prev,pager,next,sizes,jumper"
        :total="total"
        :page-sizes="[5,10, 20, 30, 50]"
        :page-size="pageSize"
        :current-page.sync="pageNum"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </div>
</template>


<script>
console.log('hello script setup')
const msg = 'Hello!'

function log() {
  console.log(msg)
}
export default {
  name: 'YourComponent',
  data() {
    return {
      // 复选框所选中信息
      selection: [],
      selectStr: "",
      // 表格数据
      tableData: [],
      // 总条数
      total: 0,
  
      // 页面条数
      pageSize: 5,
  
      // 页码
      pageNum: 1,
    };
  },
  methods: {
    async fetchData() {
      try {
        const url = 'http://localhost:8560/v1/goodscatalog/list?currentPage='+this.pageNum+'&pageSize='+this.pageSize;
        const response = await axios.get(url); // 使用GET请求获取数据
        if(response.data.flag ==true){
          this.tableData = response.data.resData.data;
          this.total = response.data.resData.total
        }else{
          this.text = this.tableData.length > 0 ? '暂无数据' : ''
        }
         
      } catch (error) {
        console.error('Error fetching data:', error); // 错误处理
      }
    },
    // 数量回调
    handleSizeChange(e) {
      this.pageSize = e;
      this.fetchData();
    },
    // 页码回调
    handleCurrentChange(e) {
      this.pageNum = e;
      this.fetchData();
    },
    // 复选框回调
    handleSelectionChange(val) {
      this.selection = val;
      this.selectStr = val.map(function (e) {return e.id}).join(",");
    },
    sortChange(column){
    this.pageNum = 1
    
    if(column.order === 'ascending'){ // 降序
      this.list.sort(this.ascSortFun)
    }else if(column.order === 'descending'){ // 升序
      this.list.sort(this.desSortFun)
    }else{
      this.fetchData()
    }
  },
 
  //升序
  ascSortFun(a, b) {
    if (a.id > b.id) return 1;
    if (a.id == b.id) return 0;
    if (a.id < b.id) return -1;
  },
 
  //降序
  desSortFun(a,b){
    if (a.id > b.id) return -1;
    if (a.id == b.id) return 0;
    if (a.id < b.id) return 1;
    }

  },
  created() {
    this.fetchData(); // 在组件创建时发送请求
  }
};
</script>
<style>
.el-tooltip__popper {
    width: 250px;
}
</style>
