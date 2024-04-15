<template>
    <div>
        分类列表{{ msg }}
    </div>
</template>

<script setup>
console.log('hello script setup')
function log() {
  console.log(msg)
}
const msg = 'Hello!'

</script>

<script>
import axios from 'axios'; // 导入axios库
 
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
        
      } catch (error) {
        console.error('Error fetching data:', error); // 错误处理
      }
    },
    // 其他方法...
  },
  created() {
    this.fetchData(); // 在组件创建时发送请求
  }
};
</script>

