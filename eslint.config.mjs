import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Phụ thuộc một chiều: app → features → components / lib.
 * - Mỗi feature chỉ lộ ra `index.ts`; bên ngoài không import sâu vào thư mục của nó.
 * - `auth` là nền: các feature khác chỉ được dùng `auth` (qua index), không dùng nhau.
 * - `components/` và `lib/` không biết gì về `features/` hay `app/`.
 */
const features = [
  "admin",
  "auth",
  "learning",
  "marketing",
  "toeic",
  "vocabulary",
  "grammar",
  "practice",
  "results",
  "notifications",
];
const indexOf = (name) => `./${name}/index.ts`;
const featureDependencies = {
  grammar: ["learning", "practice"],
  practice: ["learning"],
  toeic: ["practice"],
  results: ["practice", "vocabulary"],
};

const featureZones = features.map((name) => ({
  target: `./src/features/${name}`,
  from: "./src/features",
  except: [
    `./${name}`,
    ...(name === "auth" ? [] : [indexOf("auth")]),
    ...(featureDependencies[name] ?? []).map(indexOf),
  ],
  message: `"${name}" chỉ import chính nó và public API của dependency được khai báo.`,
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            ...featureZones,
            {
              target: "./src/app",
              from: "./src/features",
              except: features.map(indexOf),
              message: "app/ chỉ import từ @/features/<tên> (index.ts).",
            },
            {
              target: ["./src/lib", "./src/components"],
              from: ["./src/features", "./src/app"],
              message:
                "lib/ và components/ không được import features/ hay app/.",
            },
          ],
        },
      ],
    },
  },
  {
    // Nhắc tách file theo việc (cảnh báo, chưa chặn). Đếm dòng code, bỏ dòng trống và comment.
    // Ngưỡng 350 vì file dài nhất hiện nay (client API gồm các hàm độc lập, component trình bày)
    // khoảng 348 dòng; vượt ngưỡng nghĩa là file mới phình ra. Test và kiểu dữ liệu được miễn.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/types/**"],
    rules: {
      "max-lines": [
        "warn",
        { max: 350, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Skill agent cài vào repo, không phải mã nguồn của ứng dụng.
    ".claude/**",
    ".audit/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
