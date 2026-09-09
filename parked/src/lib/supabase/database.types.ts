export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admins: {
        Row: {
          added_at: string;
          email: string;
          note: string | null;
        };
        Insert: {
          added_at?: string;
          email: string;
          note?: string | null;
        };
        Update: {
          added_at?: string;
          email?: string;
          note?: string | null;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          application_id: string;
          question_id: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          application_id: string;
          question_id: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          application_id?: string;
          question_id?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "answers_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      applications: {
        Row: {
          created_at: string;
          cycle_id: string;
          full_name: string | null;
          id: string;
          linkedin_url: string | null;
          major: string | null;
          portfolio_url: string | null;
          purdue_email: string | null;
          roles_applied: string[];
          status: Database["public"]["Enums"]["application_status"];
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          year: string | null;
        };
        Insert: {
          created_at?: string;
          cycle_id: string;
          full_name?: string | null;
          id?: string;
          linkedin_url?: string | null;
          major?: string | null;
          portfolio_url?: string | null;
          purdue_email?: string | null;
          roles_applied?: string[];
          status?: Database["public"]["Enums"]["application_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
          year?: string | null;
        };
        Update: {
          created_at?: string;
          cycle_id?: string;
          full_name?: string | null;
          id?: string;
          linkedin_url?: string | null;
          major?: string | null;
          portfolio_url?: string | null;
          purdue_email?: string | null;
          roles_applied?: string[];
          status?: Database["public"]["Enums"]["application_status"];
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
          year?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          audience: string;
          created_at: string;
          email: string;
          handled_at: string | null;
          id: string;
          message: string;
          name: string;
        };
        Insert: {
          audience: string;
          created_at?: string;
          email: string;
          handled_at?: string | null;
          id?: string;
          message: string;
          name: string;
        };
        Update: {
          audience?: string;
          created_at?: string;
          email?: string;
          handled_at?: string | null;
          id?: string;
          message?: string;
          name?: string;
        };
        Relationships: [];
      };
      cycles: {
        Row: {
          closes_at: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          opens_at: string;
          slug: string;
        };
        Insert: {
          closes_at: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          opens_at: string;
          slug: string;
        };
        Update: {
          closes_at?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          opens_at?: string;
          slug?: string;
        };
        Relationships: [];
      };
      nonprofit_inquiries: {
        Row: {
          created_at: string;
          email: string;
          handled_at: string | null;
          id: string;
          location: string | null;
          message: string;
          name: string;
          organization: string;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          handled_at?: string | null;
          id?: string;
          location?: string | null;
          message: string;
          name: string;
          organization: string;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          handled_at?: string | null;
          id?: string;
          location?: string | null;
          message?: string;
          name?: string;
          organization?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          cycle_id: string;
          help: string | null;
          id: string;
          kind: Database["public"]["Enums"]["question_kind"];
          max_chars: number | null;
          options: string[] | null;
          prompt: string;
          required: boolean;
          role_id: string | null;
          slug: string;
          sort: number;
        };
        Insert: {
          cycle_id: string;
          help?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["question_kind"];
          max_chars?: number | null;
          options?: string[] | null;
          prompt: string;
          required?: boolean;
          role_id?: string | null;
          slug: string;
          sort?: number;
        };
        Update: {
          cycle_id?: string;
          help?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["question_kind"];
          max_chars?: number | null;
          options?: string[] | null;
          prompt?: string;
          required?: boolean;
          role_id?: string | null;
          slug?: string;
          sort?: number;
        };
        Relationships: [
          {
            foreignKeyName: "questions_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_cycle_id_role_id_fkey";
            columns: ["cycle_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["cycle_id", "id"];
          },
          {
            foreignKeyName: "questions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          application_id: string;
          created_at: string;
          decision: Database["public"]["Enums"]["review_decision"] | null;
          id: string;
          notes: string | null;
          reviewer_id: string;
          score: number | null;
          updated_at: string;
        };
        Insert: {
          application_id: string;
          created_at?: string;
          decision?: Database["public"]["Enums"]["review_decision"] | null;
          id?: string;
          notes?: string | null;
          reviewer_id: string;
          score?: number | null;
          updated_at?: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          decision?: Database["public"]["Enums"]["review_decision"] | null;
          id?: string;
          notes?: string | null;
          reviewer_id?: string;
          score?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          cycle_id: string;
          description: string | null;
          id: string;
          is_open: boolean;
          name: string;
          slug: string;
          sort: number;
        };
        Insert: {
          cycle_id: string;
          description?: string | null;
          id?: string;
          is_open?: boolean;
          name: string;
          slug: string;
          sort?: number;
        };
        Update: {
          cycle_id?: string;
          description?: string | null;
          id?: string;
          is_open?: boolean;
          name?: string;
          slug?: string;
          sort?: number;
        };
        Relationships: [
          {
            foreignKeyName: "roles_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "cycles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cycle_is_open: { Args: { cycle: string }; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      application_status:
        "draft" | "submitted" | "reviewing" | "accepted" | "rejected" | "waitlisted";
      question_kind: "text" | "textarea" | "select" | "multiselect" | "url";
      review_decision: "yes" | "maybe" | "no";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: ["draft", "submitted", "reviewing", "accepted", "rejected", "waitlisted"],
      question_kind: ["text", "textarea", "select", "multiselect", "url"],
      review_decision: ["yes", "maybe", "no"],
    },
  },
} as const;
