// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

address constant SWAP_ROUTER_02 = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
address constant UniswapV3Factory = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

contract ProxySwap is Ownable {
    // проксирует запросы к смартконтракту uniswap
    // принимает любые адреса и колличества
    // валидирует, что адреса действительно IERC20
    // 98% в uniswap, 2% оставляет у себя
    ISwapRouter02 private constant router = ISwapRouter02(SWAP_ROUTER_02);
    uint8 private proxyFee = 2;
    mapping(address => uint) private profit;
    error notIERC20Token();
    error notEnoughFounds();
    error poolNotExist(address tokenIn, address tokenOut);
    error slippageTooHigh();
    event swapExactInputExecuted(
        address indexed to,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 actualAmountOut,
        uint256 swapFee
    );
    event swapExactOutputExecuted(
        address indexed to,
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 amountInMax,
        uint256 actualAmountIn,
        uint256 swapFee,
        uint256 refound
    );

    constructor() Ownable(msg.sender) {}

    function swapExactInput(
        address tokenInAddress,
        uint256 amountIn,
        address tokenOutAddress,
        uint256 amountOutMin
    ) external {
        require(
            isIERC20(tokenInAddress) && isIERC20(tokenOutAddress),
            notIERC20Token()
        );
        require(amountIn != 0 && amountOutMin != 0, notEnoughFounds());

        uint24 fee = uniswapFeeResolver(tokenInAddress, tokenOutAddress);
        require(fee != 0, poolNotExist(tokenInAddress, tokenOutAddress));

        IERC20(tokenInAddress).transferFrom(
            msg.sender,
            address(this),
            amountIn
        );
        IERC20(tokenInAddress).approve(SWAP_ROUTER_02, amountIn);

        ISwapRouter02.ExactInputSingleParams memory params = ISwapRouter02
            .ExactInputSingleParams({
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                fee: fee,
                recipient: address(this),
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });
        uint256 amountOut = router.exactInputSingle(params);
        require(amountOut >= amountOutMin, slippageTooHigh());

        uint256 swapFee = (amountOut * proxyFee) / 100;

        uint256 amountOutAdjustedByFee = amountOut - swapFee;

        profit[tokenOutAddress] += swapFee;
        IERC20(tokenOutAddress).transfer(msg.sender, amountOutAdjustedByFee);
        emit swapExactInputExecuted(
            msg.sender,
            tokenInAddress,
            tokenOutAddress,
            amountIn,
            amountOutMin,
            amountOutAdjustedByFee,
            swapFee
        );
    }

    function swapExactOutput(
        address tokenInAddress,
        uint256 amountInMax,
        address tokenOutAddress,
        uint256 amountOut
    ) external {
        require(
            isIERC20(tokenInAddress) && isIERC20(tokenOutAddress),
            notIERC20Token()
        );
        require(amountInMax != 0 && amountOut != 0, notEnoughFounds());

        uint24 fee = uniswapFeeResolver(tokenInAddress, tokenOutAddress);
        require(fee != 0, poolNotExist(tokenInAddress, tokenOutAddress));

        IERC20(tokenInAddress).transferFrom(
            msg.sender,
            address(this),
            amountInMax
        );
        IERC20(tokenInAddress).approve(SWAP_ROUTER_02, amountInMax);

        ISwapRouter02.ExactOutputSingleParams memory params = ISwapRouter02
            .ExactOutputSingleParams({
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                fee: fee,
                recipient: address(this),
                amountOut: amountOut,
                amountInMaximum: amountInMax,
                sqrtPriceLimitX96: 0
            });

        uint256 amountIn = router.exactOutputSingle(params);

        uint amountInAdjustmentByFee = amountIn + (amountIn * proxyFee) / 100;

        require(amountInAdjustmentByFee <= amountInMax, notEnoughFounds());
        uint256 swapFee = amountInAdjustmentByFee - amountIn;
        profit[tokenInAddress] += swapFee;

        IERC20(tokenOutAddress).transfer(msg.sender, amountOut);

        uint256 refund = amountInMax - amountInAdjustmentByFee;

        if (amountInAdjustmentByFee < amountInMax) {
            IERC20(tokenInAddress).transfer(msg.sender, refund);
            emit swapExactOutputExecuted(
                msg.sender,
                tokenInAddress,
                tokenOutAddress,
                amountOut,
                amountInMax,
                amountIn,
                swapFee,
                refund
            );
        }
        emit swapExactOutputExecuted(
            msg.sender,
            tokenInAddress,
            tokenOutAddress,
            amountOut,
            amountInMax,
            amountIn,
            swapFee,
            0
        );
    }

    function getProxyFee() external view returns (uint8) {
        return proxyFee;
    }

    function setProxyFee(uint8 newFee) public onlyOwner {
        proxyFee = newFee;
    }

    function getProfit(
        address tokenAddress
    ) external view onlyOwner returns (uint256) {
        return profit[tokenAddress];
    }

    function withdrawProfit(address tokenToWithdraw) external onlyOwner {
        uint256 amount = profit[tokenToWithdraw];
        profit[tokenToWithdraw] = 0;

        IERC20(tokenToWithdraw).transfer(owner(), amount);
    }

    function isIERC20(address token) public view returns (bool) {
        try IERC20(token).totalSupply() returns (uint256) {
            return true;
        } catch {
            return false;
        }
    }

    function uniswapFeeResolver(
        address tokenIn,
        address tokenOut
    ) private view returns (uint24) {
        uint24[] memory fees = new uint24[](3);
        fees[0] = 500;
        fees[1] = 3000;
        fees[2] = 10000;

        for (uint i = 0; i < fees.length; ++i) {
            address pool = IUniswapV3Factory(UniswapV3Factory).getPool(
                tokenIn,
                tokenOut,
                fees[i]
            );
            if (pool != address(0)) {
                return fees[i];
            }
        }
        return 0;
    }
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    function exactOutputSingle(
        ExactOutputSingleParams calldata params
    ) external payable returns (uint256 amountIn);
}

/**
 * @title IUniswapV3Factory
 * @notice Минимальный интерфейс фабрики Uniswap V3.
 */
interface IUniswapV3Factory {
    /**
     * @notice Возвращает адрес пула для заданных токенов и fee.
     * @param tokenA Первый токен пары.
     * @param tokenB Второй токен пары.
     * @param fee Уровень комиссии пула (например, 3000 = 0.3%).
     * @return pool Адрес пула или address(0), если такого пула нет.
     */
    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool);

    /**
     * @notice Создаёт новый пул, если он ещё не существует.
     * @param tokenA Первый токен пары.
     * @param tokenB Второй токен пары.
     * @param fee Уровень комиссии пула.
     * @return pool Адрес нового пула.
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool);
}
