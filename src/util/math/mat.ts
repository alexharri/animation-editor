import * as mathjs from "mathjs";
import { getAngleRadians } from "~/util/math";

type Matrix2x2 = [[number, number], [number, number]];

/**
 * 2x2 matrix
 */
export class Mat2 {
	public static new(matrix: Matrix2x2) {
		return new Mat2(matrix);
	}

	public static identity() {
		return new Mat2([
			[1, 0],
			[0, 1],
		]);
	}

	public static rotation(rad: number) {
		const sin = Math.sin(rad);
		const cos = Math.cos(rad);

		return new Mat2([
			[cos, sin],
			[-sin, cos],
		]);
	}

	public matrix: Matrix2x2;

	constructor(matrix: Matrix2x2) {
		this.matrix = matrix;
	}

	public scale(scalar: number) {
		const [ix, iy] = this.matrix[0];
		const [jx, jy] = this.matrix[1];
		return Mat2.new([
			[ix * scalar, iy * scalar],
			[jx * scalar, jy * scalar],
		]);
	}

	public scaleX(scalar: number) {
		const [ix, iy] = this.matrix[0];
		const [jx, jy] = this.matrix[1];
		return Mat2.new([
			[ix * scalar, iy],
			[jx * scalar, jy],
		]);
	}

	public scaleY(scalar: number) {
		const [ix, iy] = this.matrix[0];
		const [jx, jy] = this.matrix[1];
		return Mat2.new([
			[ix, iy * scalar],
			[jx, jy * scalar],
		]);
	}

	public scaleXY(scaleX: number, scaleY: number) {
		const [ix, iy] = this.matrix[0];
		const [jx, jy] = this.matrix[1];
		return Mat2.new([
			[ix * scaleX, iy * scaleY],
			[jx * scaleX, jy * scaleY],
		]);
	}

	public rotate(rad: number) {
		return this.multiplyMat2(Mat2.rotation(rad));
	}

	public skewX(rad: number) {
		const matrix: Matrix2x2 = [
			[1, Math.tan(rad)],
			[0, 1],
		];
		return this.multiplyMat2(Mat2.new(matrix));
	}
	public skewY(rad: number) {
		const matrix: Matrix2x2 = [
			[1, 0],
			[Math.tan(rad), 1],
		];
		return this.multiplyMat2(Mat2.new(matrix));
	}

	public multiply<T extends Mat2 | Vec2>(matOrVec: T): T {
		if (matOrVec instanceof Mat2) {
			return this.multiplyMat2(matOrVec) as T;
		}

		return this.multiplyVec2(matOrVec as Vec2) as T;
	}

	public multiplyVec2(vec: Vec2): Vec2 {
		const [ix, iy] = this.matrix[0];
		const [jx, jy] = this.matrix[1];

		const { x, y } = vec;

		return Vec2.new(x * ix + y * jx, x * iy + y * jy);
	}

	public multiplyMat2(mat2: Mat2) {
		const result: Matrix2x2 = [
			[0, 0],
			[0, 0],
		];

		const a = this.matrix;
		const b = mat2.matrix;

		for (let r = 0; r < 2; r++) {
			for (let c = 0; c < 2; c++) {
				for (let i = 0; i < 2; i++) {
					result[r][c] += a[r][i] * b[i][c];
				}
			}
		}

		return Mat2.new(result);
	}

	public getRotationAngle(): number {
		const [ix, iy] = this.matrix[0];
		return getAngleRadians(Vec2.new(0, 0), Vec2.new(ix, iy));
	}

	public i(): Vec2 {
		const [ix, iy] = this.matrix[0];
		return Vec2.new(ix, iy);
	}

	public j(): Vec2 {
		const [jx, jy] = this.matrix[1];
		return Vec2.new(jx, jy);
	}

	public inverse(): Mat2 {
		const matrix = mathjs.inv(this.matrix);
		return Mat2.new(matrix);
	}
}
