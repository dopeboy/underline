import jwt_decode from 'jwt-decode'

export const saveJWT = (jwt) => {
    localStorage.setItem('jwt', jwt)
}

export const clearJWT = () => {
    localStorage.clear()
}

export const getJWT = () => {
    return localStorage.getItem('jwt')
}

export const isActiveJWT = () => {
    if (localStorage.getItem('jwt') === null) return false

    var decoded = jwt_decode(localStorage.getItem('jwt'))
    var current_time = new Date().getTime() / 1000
    return current_time <= decoded.exp
}

export const parseQuery = (string) => {
    return new URLSearchParams(string)
}
