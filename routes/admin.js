const express = require("express");
const {
	getAdminMetaData,
	getFieldNames,
	setProductsRoutes
} = require("./utils");
const router = express.Router();
const {
	ensureAuthenticated,
	ensureAdminAuthorized
} = require("../config/auth");
const User = require("../models/User");
const Product = require("../models/Product");
const productCategories = require("../models/productCategories");

// ** Working GET Route for admin dashboard **
router.get("/", ensureAuthenticated, ensureAdminAuthorized, (req, res) => {
	res.render("admin/index", {
		...getAdminMetaData(req.user.name)
	});
});

// ** Working GET Route for User **
router.get("/user", ensureAuthenticated, ensureAdminAuthorized, (req, res) => {
	const users = User.find({}, (err, data) => {
		if (err) {
			console.log(err);
		}
		res.render("admin/userData", {
			...getAdminMetaData(req.user.name),

			currentModel: User,
			fields: getFieldNames(User),
			data: data.map(item => {
				return {
					id: item.id,
					name: item.name,
					email: item.email,
					date: item.date,
					admin: item.admin
				};
			})
		});
	});
});

// ** Working GET Routes for Products **
setProductsRoutes(router, productCategories);

// ** Working POST Route for Products **
//* ADDS new produts in the system
router.post(
	"/product/add",
	ensureAuthenticated,
	ensureAdminAuthorized,
	(req, res) => {
		const {
			category,
			name,
			price,
			quantity,
			tax,
			primaryImage,
			productImage1,
			productImage2,
			productImage3,
			specs
		} = req.body;

		const newProduct = new Product({
			category,
			name,
			price,
			quantity,
			tax,
			images: [primaryImage, productImage1, productImage2, productImage3],
			specs
		});

		if (category === "none") {
			req.flash(
				"error_msg",
				"Error adding new product due to invalid input!"
			);
			res.redirect(`back`);
		} else {
			newProduct
				.save()
				.then(product => {
					req.flash(
						"success_msg",
						`New ${product.category} has been added!`
					);
					res.redirect("back");
				})
				.catch(err => {
					console.log(err);
					req.flash("error_msg", "Internal error occured :(");
					res.redirect(`back`);
				});
		}
	}
);

// ** Working GET Route for a specific Product detail **
//* Display single product
router.get(
	"/product/:id/details",
	ensureAuthenticated,
	ensureAdminAuthorized,
	(req, res) => {
		// get the id from req params
		const id = req.params.id;

		// check if the product with that id exists
		Product.findById(id, (error, item) => {
			// if item is found
			if (item) {
				const {
					id,
					category,
					name,
					price,
					quantity,
					tax,
					images,
					specs
				} = item;
				const [
					primaryImage,
					productImage1,
					productImage2,
					productImage3
				] = images;

				return res.render("admin/productDetails", {
					...getAdminMetaData("req.user.name"),
					product: {
						id,
						category,
						name,
						price,
						quantity,
						tax,
						specs,
						primaryImage,
						productImage1,
						productImage2,
						productImage3
					},
					productCategories
				});
			}
			return res.render("404");
		});
	}
);

//*  Working POST Route to update a specific product
router.post(
	"/product/:id/edit",
	ensureAuthenticated,
	ensureAdminAuthorized,
	(req, res) => {
		// get the id from req params
		const id = req.params.id;

		// check if the product with that id exists
		Product.findById(id, (error, item) => {
			// if not send 404
			if (error) {
				req.flash("error_msg", "Product not found for update");
				return res.redirect("back");
			}

			// if item is found
			else if (item) {
				const {
					category,
					name,
					price,
					quantity,
					tax,
					primaryImage,
					productImage1,
					productImage2,
					productImage3,
					specs
				} = req.body;

				const images = [
					primaryImage,
					productImage1,
					productImage2,
					productImage3
				];

				// validate the params
				// ! skipped
				// if invalid send 400 (bad request)
				// ! skipped

				// else perform update
				item.category = category;
				item.name = name;
				item.price = price;
				item.tax = tax;
				item.specs = specs;
				item.images = images;
				item.quantity = quantity;

				item.save()
					.then(item => {
						req.flash(
							"success_msg",
							"Product updated successfully!"
						);
						return res.redirect("back");
					})
					.catch(err => {
						req.flash(
							"error_msg",
							"Internal error occured. Try again later!"
						);
						return res.redirect("back");
					});
			} else {
				req.flash("error_msg", "Product not found for update");
				return res.redirect("back");
			}
		});
	}
);

//*  Working POST Route to delete a specific Product
router.delete("/product/:id/delete", (req, res) => {
	// get the id from req params
	const id = req.params.id;

	// check if the product with that id exists
	Product.findByIdAndDelete(id, (error, responseDoc) => {
		// if not send 404
		if (error) {
			return res.status(400).json({ status: 400, error: "Bad Request" });
		}

		// if item is found
		else if (responseDoc) {
			return res.status(200).json(responseDoc);
		} else {
			return res
				.status(404)
				.json({ status: 404, error: "Product Not Found" });
		}
	});
});

//*  Working POST Route to delete a specific User
router.delete("/user/:id/delete", (req, res) => {
	// get the id from req params
	const id = req.params.id;

	// check if the product with that id exists
	User.findByIdAndDelete(id, (error, responseDoc) => {
		// if not send 404
		if (error) {
			return res.status(400).json({ status: 400, error: "Bad Request" });
		}

		// if item is found
		else if (responseDoc) {
			return res.status(200).json(responseDoc);
		} else {
			return res
				.status(404)
				.json({ status: 404, error: "User Not Found" });
		}
	});
});

module.exports = router;
