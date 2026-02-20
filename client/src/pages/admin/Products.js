import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/AdminMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

//Chen Zhiruo A0256855N
const Products = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [total, setTotal] = useState(0);

  //get all products
  const getAllProducts = async (pageToLoad = 1) => {
    try {
      const { data } = await axios.get("/api/v1/product/get-product", {
        params: { page: pageToLoad, perPage },
      });
      setProducts(data.products);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      console.log(error.message);
      toast.error("Something Went Wrong");
    }
  };

  //lifecycle method
  useEffect(() => {
    getAllProducts();
  }, []);
  return (
    <Layout>
      <div className="row">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center">All Products List</h1>
          <div className="d-flex flex-wrap">
            {products?.map((p) => (
              <Link
                key={p._id}
                to={`/dashboard/admin/product/${p.slug}`}
                className="product-link"
              >
                <div className="card m-2" style={{ width: "18rem" }}>
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top" 
                    alt={p.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text">{p.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="d-flex justify-content-between my-3">
            <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => getAllProducts(page - 1)}
            >
              Previous
            </button>

            <div>
              Page {page} of {Math.ceil(total / perPage) || 1}
            </div>

            <button
                className="btn btn-secondary"
                disabled={page >= Math.ceil(total / perPage)}
                onClick={() => getAllProducts(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
