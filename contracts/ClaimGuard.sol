// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Local demonstration only. Keys are namespaced serial identities, not certified credits.
contract ClaimGuard {
    address public immutable reviewer = msg.sender;
    mapping(bytes32 => bytes32) public usedBy;
    event Recorded(bytes32 indexed claimDigest, bytes32 indexed evidenceDigest, uint256 serialCount);
    function record(bytes32[] calldata serials, bytes32 claimDigest, bytes32 evidenceDigest) external {
        require(msg.sender == reviewer, "reviewer only");
        require(serials.length > 0 && serials.length <= 200, "batch size");
        require(claimDigest != bytes32(0) && evidenceDigest != bytes32(0), "missing digest");
        for (uint256 i; i < serials.length; i++) {
            require(usedBy[serials[i]] == bytes32(0), "serial already used");
            usedBy[serials[i]] = claimDigest;
        }
        emit Recorded(claimDigest, evidenceDigest, serials.length);
    }
}
