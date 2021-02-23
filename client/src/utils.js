export const saveJWT = (jwt) => {
    localStorage.setItem('jwt', jwt)
}

export const clearJWT = () => {
    localStorage.clear()
}

export const getJWT = () => {
    return localStorage.getItem('jwt')
}

export const parseQuery = (string) => {
    return new URLSearchParams(string)
}
