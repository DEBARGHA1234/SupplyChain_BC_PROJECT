// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    enum Role { None, Manufacturer, Supplier, DeliveryPerson, Customer }
    enum Status { Created, InTransitToSupplier, WithSupplier, InTransitToCustomer, Delivered }

    struct TrackingStep {
        string location;
        uint256 timestamp;
        address updatedBy;
        Status status;
    }

    struct Product {
        uint256 id;
        string name;
        string description;
        address manufacturer;
        address supplier;
        address deliveryPerson;
        address customer;
        address currentOwner;
        Status status;
        TrackingStep[] history;
    }

    uint256 public productCount;
    mapping(uint256 => Product) private products;
    mapping(address => Role) public userRoles;

    event UserRegistered(address indexed user, Role role);
    event ProductCreated(uint256 indexed id, string name, address indexed manufacturer);
    event StatusUpdated(uint256 indexed id, Status status, string location, address indexed updatedBy);

    modifier onlyRole(Role _role) {
        require(userRoles[msg.sender] == _role, "Unauthorized role");
        _;
    }

    function registerUser(Role _role) external {
        require(_role != Role.None, "Invalid role");
        userRoles[msg.sender] = _role;
        emit UserRegistered(msg.sender, _role);
    }

    function createProduct(string memory _name, string memory _description, string memory _initialLocation)
        external
        onlyRole(Role.Manufacturer)
        returns (uint256)
    {
        productCount++;
        Product storage p = products[productCount];
        p.id = productCount;
        p.name = _name;
        p.description = _description;
        p.manufacturer = msg.sender;
        p.currentOwner = msg.sender;
        p.status = Status.Created;

        p.history.push(TrackingStep({
            location: _initialLocation,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            status: Status.Created
        }));

        emit ProductCreated(productCount, _name, msg.sender);
        return productCount;
    }

    function updateStatus(
        uint256 _id,
        Status _newStatus,
        string memory _location,
        address _nextOwner
    ) external {
        Product storage p = products[_id];
        require(p.id != 0, "Product does not exist");

        if (_newStatus == Status.InTransitToSupplier) {
            require(userRoles[msg.sender] == Role.Manufacturer, "Only Manufacturer can dispatch");
            p.supplier = _nextOwner;
        } else if (_newStatus == Status.WithSupplier) {
            require(userRoles[msg.sender] == Role.Supplier, "Only assigned Supplier can accept");
        } else if (_newStatus == Status.InTransitToCustomer) {
            require(userRoles[msg.sender] == Role.Supplier || userRoles[msg.sender] == Role.DeliveryPerson, "Unauthorized dispatch");
            p.customer = _nextOwner;
        } else if (_newStatus == Status.Delivered) {
            require(userRoles[msg.sender] == Role.Customer || userRoles[msg.sender] == Role.DeliveryPerson, "Unauthorized delivery confirmation");
        }

        p.status = _newStatus;
        if (_nextOwner != address(0)) {
            p.currentOwner = _nextOwner;
        }

        p.history.push(TrackingStep({
            location: _location,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            status: _newStatus
        }));

        emit StatusUpdated(_id, _newStatus, _location, msg.sender);
    }

    function getProduct(uint256 _id)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory description,
            address manufacturer,
            address supplier,
            address deliveryPerson,
            address customer,
            address currentOwner,
            Status status
        )
    {
        Product storage p = products[_id];
        require(p.id != 0, "Product not found");
        return (
            p.id,
            p.name,
            p.description,
            p.manufacturer,
            p.supplier,
            p.deliveryPerson,
            p.customer,
            p.currentOwner,
            p.status
        );
    }

    function getProductHistory(uint256 _id) external view returns (TrackingStep[] memory) {
        require(products[_id].id != 0, "Product not found");
        return products[_id].history;
    }
}
