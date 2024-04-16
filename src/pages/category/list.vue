<template>
    <div>
        分类列表{{ msg }}$store.state.user.avatar

        <el-table :data="tableData" height="250" style="width: 100%">
        <el-table-column prop="date" label="Date" width="180" />
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="address" label="Address" />
      </el-table>

    </div>
</template>

<script  setup>
import axios from 'axios'; // 导入axios库

console.log('hello script setup')
function log() {
  console.log(msg)
}
const msg = 'Hello!'


</script>

<script>
 
export default {
  name: 'YourComponent',
  data() {
    return {
      // 你的数据属性
    };
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get('http://localhost:8099/goodscatalog/list'); // 使用GET请求获取数据
        // 处理响应数据
        console.log(response.data)
        this.someData = response.data; // 假设你想把数据存储在组件的某些Data属性中
        this.tableData = [
          {
            date: '2016-05-03',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          },
          {
            date: '2016-05-02',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          }
        ]
      } catch (error) {
        console.error('Error fetching data:', error); // 错误处理
        this.tableData = [
          {
            date: '2019-05-03',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          },
          {
            date: '2019-05-02',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
          }
        ]
      }
    },
    // 其他方法...
  },
  created() {
    this.fetchData(); // 在组件创建时发送请求
  }
};
</script>

