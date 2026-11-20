import React, { useEffect, useState } from "react";
import { Layout } from "./App";

const USER_ROLE_DIST_API = "/GrievanceServices/epds/UserRoleDist";

export default function AdminUserMapping() {

    const [userRoleList, setUserRoleList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [distCode, setDistCode] = useState("All");
    const [mandCode, setMandCode] = useState("All");
    const [disposal, setDisposal] = useState("0");
    const [roleId, setRoleId] = useState("All");

    // ------------------------------------------------------------------
    // USER ROLE DISTRICT API
    // ------------------------------------------------------------------

    const getUserRoleDist = async (
        district = "All",
        mandal = "All",
        disposalType = "0",
        selectedRole = "All"
    ) => {

        try {

            const response = await fetch(USER_ROLE_DIST_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    distCode: district,
                    mandCode: mandal,
                    disposal: disposalType,
                    roleId: selectedRole
                })
            });

            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }

            const data = await response.json();

            console.log("UserRoleDist API Response:", data);

            if (String(data.respCode) === "0") {
                return data.userRoleList || [];
            }

            if (String(data.respCode) === "-104") {
                return [];
            }

            throw new Error(data.respMsg || "Unable to retrieve user role details");

        } catch (err) {
            throw err;
        }
    };

    // ------------------------------------------------------------------
    // LOAD REPORT
    // ------------------------------------------------------------------

    const loadUserRoleDist = async () => {

        setLoading(true);
        setError("");

        try {

            const list = await getUserRoleDist(
                distCode,
                mandCode,
                disposal,
                roleId
            );

            setUserRoleList(list);

        } catch (err) {

            console.error("UserRoleDist Error:", err);
            setError(err.message || "Failed to load report");
            setUserRoleList([]);

        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // INITIAL API CALL
    // ------------------------------------------------------------------

    useEffect(() => {
        loadUserRoleDist();
    }, []);

    // ------------------------------------------------------------------
    // TOTALS
    // ------------------------------------------------------------------

    const total = userRoleList.reduce(
        (sum, item) => sum + Number(item.total || 0), 0
    );

    const pending = userRoleList.reduce(
        (sum, item) => sum + Number(item.pending || 0), 0
    );

    const approved = userRoleList.reduce(
        (sum, item) => sum + Number(item.approved || 0), 0
    );

    const rejected = userRoleList.reduce(
        (sum, item) => sum + Number(item.rejected || 0), 0
    );

    // ------------------------------------------------------------------
    // UI
    // ------------------------------------------------------------------

    return (
        <Layout>

            <div className="container-fluid mt-3">

                <div className="card">

                    <div className="card-header">
                        <h4>User Role District Report</h4>
                    </div>

                    <div className="card-body">

                        {/* FILTERS */}

                        <div className="row mb-3">

                            <div className="col-md-3">
                                <label>District Code</label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={distCode}
                                    onChange={(e) => setDistCode(e.target.value)}
                                    placeholder="All"
                                />
                            </div>

                            <div className="col-md-3">
                                <label>Mandal Code</label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={mandCode}
                                    onChange={(e) => setMandCode(e.target.value)}
                                    placeholder="All"
                                />
                            </div>

                            <div className="col-md-3">
                                <label>Disposal</label>

                                <select
                                    className="form-control"
                                    value={disposal}
                                    onChange={(e) => setDisposal(e.target.value)}
                                >
                                    <option value="0">All</option>
                                    <option value="1">Pending</option>
                                    <option value="2">Approved</option>
                                    <option value="3">Rejected</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label>Role ID</label>

                                <input
                                    type="text"
                                    className="form-control"
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                    placeholder="All"
                                />
                            </div>

                        </div>

                        {/* BUTTONS */}

                        <div className="mb-3">

                            <button
                                className="btn btn-primary mr-2"
                                onClick={loadUserRoleDist}
                                disabled={loading}
                            >
                                {loading ? "Loading..." : "Search"}
                            </button>

                            <button
                                className="btn btn-secondary ml-2"
                                onClick={() => {
                                    setDistCode("All");
                                    setMandCode("All");
                                    setDisposal("0");
                                    setRoleId("All");
                                }}
                            >
                                Reset
                            </button>

                            <button
                                className="btn btn-info ml-2"
                                onClick={loadUserRoleDist}
                                disabled={loading}
                            >
                                Refresh
                            </button>

                            <button
                                className="btn btn-success ml-2"
                                onClick={() => window.print()}
                            >
                                Print
                            </button>

                        </div>

                        {/* ERROR */}

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        {/* SUMMARY */}

                        <div className="row mb-3">

                            <div className="col-md-3">
                                <div className="card p-3">
                                    <h6>Total</h6>
                                    <h4>{total}</h4>
                                </div>
                            </div>

                            <div className="col-md-3">
                                <div className="card p-3">
                                    <h6>Pending</h6>
                                    <h4>{pending}</h4>
                                </div>
                            </div>

                            <div className="col-md-3">
                                <div className="card p-3">
                                    <h6>Approved</h6>
                                    <h4>{approved}</h4>
                                </div>
                            </div>

                            <div className="col-md-3">
                                <div className="card p-3">
                                    <h6>Rejected</h6>
                                    <h4>{rejected}</h4>
                                </div>
                            </div>

                        </div>

                        {/* REPORT TABLE */}

                        <div className="table-responsive">

                            <table className="table table-bordered table-striped">

                                <thead className="thead-dark">
                                    <tr>
                                        <th>S.No</th>
                                        <th>District Code</th>
                                        <th>District Name</th>
                                        <th>User Role ID</th>
                                        <th>User Role</th>
                                        <th>Total</th>
                                        <th>Pending</th>
                                        <th>Approved</th>
                                        <th>Rejected</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {loading ? (

                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                Loading report...
                                            </td>
                                        </tr>

                                    ) : userRoleList.length > 0 ? (

                                        userRoleList.map((item, index) => (

                                            <tr key={index}>

                                                <td>{index + 1}</td>
                                                <td>{item.distCode}</td>
                                                <td>{item.distName}</td>
                                                <td>{item.roleId}</td>
                                                <td>{item.role}</td>
                                                <td>{item.total}</td>
                                                <td>{item.pending}</td>
                                                <td>{item.approved}</td>
                                                <td>{item.rejected}</td>

                                            </tr>

                                        ))

                                    ) : (

                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                {error ? "Unable to load records" : "No records found"}
                                            </td>
                                        </tr>

                                    )}

                                </tbody>

                                {userRoleList.length > 0 && (
                                    <tfoot>
                                        <tr className="font-weight-bold">
                                            <td colSpan="5">Grand Total</td>
                                            <td>{total}</td>
                                            <td>{pending}</td>
                                            <td>{approved}</td>
                                            <td>{rejected}</td>
                                        </tr>
                                    </tfoot>
                                )}

                            </table>

                        </div>

                    </div>

                </div>

            </div>

        </Layout>
    );
}