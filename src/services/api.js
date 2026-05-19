import axios from "axios";

const API_URL = "https://6a0c018f5aa893e1015ac454.mockapi.io/objects";

export const getObjects = () => {
  return axios.get(API_URL);
};

export const getObjectById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

export const createObject = (data) => {
  return axios.post(API_URL, data);
};

export const updateObject = (id, data) => {
  return axios.put(`${API_URL}/${id}`, data);
};

export const deleteObject = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};