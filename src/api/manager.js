import axios from '~/axios'

export function login(username,password){
    return axios.post("/mall/v1/admin/login",{
        username,
        password
    })
}

export function getinfo(){
    return axios.post("/mall/v1/admin/getinfo")
}

export function logout(){
    return axios.post("/mall/v1/admin/logout")
}

export function updatepassword(data){
    return axios.post("/mall/v1/admin/updatepassword",data)
}